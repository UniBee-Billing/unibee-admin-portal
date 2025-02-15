import {
  CheckOutlined,
  ExclamationOutlined,
  LoadingOutlined
} from '@ant-design/icons'
import { Button, List, message, Tag } from 'antd'

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEffect, useState } from 'react'
import { randomString } from '../../../helpers'
import {
  getPaymentGatewayConfigListReq,
  getPaymentGatewayListReq,
  sortGatewayReq
} from '../../../requests'
import { TGateway } from '../../../shared.types'
import { useAppConfigStore } from '../../../stores'
import PaymentGatewaySetupModal from './setupModal'
import ModalWireTransfer from './wireTransferModal'

interface SortableItemProps {
  id: string
  children: React.ReactNode
}

function SortableItem(props: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: props.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {props.children}
    </div>
  )
}
const Index = () => {
  const appConfig = useAppConfigStore()
  const [loading, setLoading] = useState(false)
  const [gatewayConfigList, setGatewayConfigList] = useState<TGateway[]>([])
  const [gatewayName, setGatewayName] = useState('') // the gateway user want to config(open Modal to config this gateway)
  const [openSetupModal, setOpenSetupModal] = useState(false)
  const toggleSetupModal = (gatewayName?: string) => {
    setOpenSetupModal(!openSetupModal)
    setGatewayName(gatewayName ?? '')
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )
  const handleDragEnd = (event: DragEndEvent) => {
    const tgt = event.activatorEvent.target

    if (
      tgt != undefined &&
      tgt instanceof Element &&
      tgt.closest('.btn-gateway-config') != undefined
    ) {
      const gatewayClicked = tgt
        ?.closest('.btn-gateway-config')
        ?.getAttribute('data-gateway-name')
      toggleSetupModal(gatewayClicked as string)
      return
    }

    const { active, over } = event

    let oldIndex = -1,
      newIndex = -1
    let newConfigList: TGateway[] = []
    if (over != null && active.id !== over.id) {
      setGatewayConfigList((gatewayConfigList) => {
        oldIndex = gatewayConfigList.findIndex((i) => i.id == active.id)
        newIndex = gatewayConfigList.findIndex((i) => i.id == over.id)
        newConfigList = arrayMove(gatewayConfigList, oldIndex, newIndex)
        return newConfigList
      })
    }
    if (oldIndex != newIndex && oldIndex != -1 && newIndex != -1) {
      reorder(newConfigList)
    }
  }

  const updateGatewayInStore = async () => {
    const [gateways, getGatewayErr] = await getPaymentGatewayListReq()
    if (getGatewayErr == null) {
      return
    }
    // after gatewayConfig changes, it's better to re-fetch the gatewayList, and save it into local store.
    appConfig.setGateway(gateways)
  }

  const reorder = async (gatewayList: TGateway[]) => {
    const sortObj = gatewayList.map((g: TGateway, idx: number) => ({
      gatewayName: g.gatewayName,
      gatewayId: g.gatewayId,
      sort: idx + 1 // 0 would caused error in BE
    }))
    setLoading(true)
    const [_, err] = await sortGatewayReq(sortObj)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    updateGatewayInStore()
  }

  const getGatewayConfigList = async () => {
    setLoading(true)
    const [gateways, err] = await getPaymentGatewayConfigListReq({
      refreshCb: getGatewayConfigList
    })
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }

    gateways
      .sort((a: TGateway, b: TGateway) => a.sort - b.sort)
      .forEach((g: TGateway) => (g.id = randomString(8)))

    const wireTransferIdx = gateways.findIndex(
      (g: TGateway) => g.gatewayName == 'wire_transfer'
    )
    const CURRENCY = appConfig.supportCurrency.find(
      (c) => c.Currency == gateways[wireTransferIdx].currency
    )
    if (wireTransferIdx != -1 && CURRENCY != undefined) {
      gateways[wireTransferIdx].minimumAmount /= CURRENCY.Scale
    }

    setGatewayConfigList(gateways)
  }

  useEffect(() => {
    getGatewayConfigList()
  }, [])

  return (
    <div>
      {openSetupModal &&
        (gatewayName != 'wire_transfer' ? (
          <PaymentGatewaySetupModal
            gatewayConfig={
              gatewayConfigList.find((i) => i.gatewayName == gatewayName)!
            }
            closeModal={toggleSetupModal}
            refresh={getGatewayConfigList}
            updateGatewayInStore={updateGatewayInStore}
          />
        ) : (
          <ModalWireTransfer
            gatewayConfig={
              gatewayConfigList.find((i) => i.gatewayName == gatewayName)!
            }
            closeModal={toggleSetupModal}
            refresh={getGatewayConfigList}
            updateGatewayInStore={updateGatewayInStore}
          />
        ))}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <List
          loading={{
            indicator: <LoadingOutlined spin />,
            spinning: loading,
            size: 'large'
          }}
          itemLayout="horizontal"
          dataSource={gatewayConfigList}
          renderItem={(item, _index) => (
            <SortableContext
              items={gatewayConfigList.map((item) => ({ id: item.id || '' }))}
              strategy={verticalListSortingStrategy}
            >
              <SortableItem key={item.id || ''} id={item.id || ''}>
                <List.Item
                  className="cursor-grab rounded-md hover:bg-gray-100"
                  style={{
                    borderBottom:
                      _index != gatewayConfigList.length - 1
                        ? '1px solid #0505050f'
                        : 'unset'
                  }}
                >
                  <List.Item.Meta
                    avatar={
                      item.gatewayWebsiteLink == '' ? (
                        <div className="ml-3 flex h-8 items-center justify-center overflow-hidden">
                          <img
                            style={{ flexShrink: 0 }}
                            height={'100%'}
                            src={item.gatewayLogo}
                          />
                        </div>
                      ) : (
                        <a href={item.gatewayWebsiteLink} target="_blank">
                          <div className="ml-3 flex h-8 items-center justify-center overflow-hidden">
                            <img
                              style={{ flexShrink: 0 }}
                              height={'100%'}
                              src={item.gatewayLogo}
                            />
                          </div>
                        </a>
                      )
                    }
                    title={
                      item.gatewayWebsiteLink == '' ? (
                        <span>
                          {item.name}
                          <span className="text-xs text-gray-500">{` (${item.displayName})`}</span>
                        </span>
                      ) : (
                        <a href={item.gatewayWebsiteLink} target="_blank">
                          <span>
                            {item.name}
                            <span className="text-xs text-gray-500">{` (${item.displayName})`}</span>
                          </span>
                        </a>
                      )
                    }
                    description={item.description}
                  />
                  <div className="mr-3 flex w-[180px] items-center justify-between">
                    {item.IsSetupFinished ? (
                      <Tag icon={<CheckOutlined />} color="#34C759">
                        Ready
                      </Tag>
                    ) : (
                      <Tag icon={<ExclamationOutlined />} color="#AEAEB2">
                        Not Set
                      </Tag>
                    )}
                    <Button
                      className="btn-gateway-config"
                      data-gateway-name={item.gatewayName}
                      // this button's onClick never has a chance to run, instead it'd get captured by handleDragEnd.
                      // so let handleDragEnd trigger setupModal based on className.
                      type={item.IsSetupFinished ? 'default' : 'primary'}
                    >
                      {item.IsSetupFinished ? 'Edit' : 'Set up'}
                    </Button>
                  </div>
                </List.Item>
              </SortableItem>
            </SortableContext>
          )}
        />
      </DndContext>
    </div>
  )
}
export default Index
