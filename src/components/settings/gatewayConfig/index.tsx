import {
  CheckOutlined,
  ExclamationOutlined,
  LoadingOutlined,
  MoreOutlined,
  StarOutlined,
  StarFilled,
  DeleteOutlined,
  UndoOutlined
} from '@ant-design/icons'
import { Button, List, message, Tag, Dropdown, Modal } from 'antd'


import {
  getPaymentGatewayConfigListReq,
  getPaymentGatewayListReq,
  sortGatewayReq,
  setGatewayDefaultReq,
  archiveGatewayReq,
  restoreGatewayReq
} from '@/requests/index'
import { TGateway } from '@/shared.types'
import { useAppConfigStore } from '@/stores'
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
  const [selectedGatewayId, setSelectedGatewayId] = useState<number>(0) // the gateway user want to config(open Modal to config this gateway)
  const [selectedGatewayName, setSelectedGatewayName] = useState<string>('') // for new gateways with gatewayId = 0
  const [openSetupModal, setOpenSetupModal] = useState(false)
  const [isDuplicateMode, setIsDuplicateMode] = useState(false) // flag to indicate if we're duplicating a gateway
  const toggleSetupModal = (gatewayId?: number, gatewayName?: string, duplicate = false) => {
    setOpenSetupModal(!openSetupModal)
    setSelectedGatewayId(gatewayId ?? 0)
    setSelectedGatewayName(gatewayName ?? '')
    setIsDuplicateMode(duplicate)
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )
  const handleDragEnd = (event: DragEndEvent) => {
    const tgt = event.activatorEvent.target

    // Ignore clicks on dropdown button
    if (
      tgt != undefined &&
      tgt instanceof Element &&
      (tgt.closest('.dropdown-more-btn') != undefined ||
        tgt.closest('.ant-dropdown') != undefined)
    ) {
      return
    }

    if (
      tgt != undefined &&
      tgt instanceof Element &&
      tgt.closest('.btn-gateway-config') != undefined
    ) {
      const gatewayIdClicked = tgt
        ?.closest('.btn-gateway-config')
        ?.getAttribute('data-gateway-id')
      const gatewayNameClicked = tgt
        ?.closest('.btn-gateway-config')
        ?.getAttribute('data-gateway-name')
      const isDuplicate = tgt
        ?.closest('.btn-gateway-config')
        ?.getAttribute('data-action') === 'duplicate'
      toggleSetupModal(parseInt(gatewayIdClicked as string), gatewayNameClicked as string, isDuplicate)
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
    const [gateways, gatewaysErr] = await getPaymentGatewayListReq()
    if (gatewaysErr != null) {
      message.error(gatewaysErr.message)
      return
    }
    // after gatewayConfig changed, re-fetch the gatewayList, and save it into local store.
    // getPaymentGatewayListReq return all the gateways ready for payment(<PaymentSelector /> use this list)
    // getPaymentGatewayConfigListReq returned all the gateways config items, they have the similar structures, but for different use cases.
    appConfig.setGateway(gateways)
  }

  const handleSetAsDefault = async (gatewayId: number, gatewayName: string) => {
    setLoading(true)
    const [_, err] = await setGatewayDefaultReq(gatewayId)
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    message.success(`${gatewayName} has been set as default`)

    // Immediately update local state
    setGatewayConfigList(prevList =>
      prevList.map(gateway => ({
        ...gateway,
        isDefault: gateway.gatewayId === gatewayId
      }))
    )

    getGatewayConfigList()
    updateGatewayInStore()
  }

  const handleArchive = async (gatewayId: number, gatewayName: string) => {
    Modal.confirm({
      title: 'Archive Gateway',
      content: `Are you sure you want to archive ${gatewayName}? If archived, it won't be shown on checkout page.`,
      onOk: async () => {
        setLoading(true)
        const [_, err] = await archiveGatewayReq(gatewayId)
        setLoading(false)
        if (err != null) {
          message.error(err.message)
          return
        }
        message.success(`${gatewayName} has been archived`)
        getGatewayConfigList()
        updateGatewayInStore()
      }
    })
  }

  const handleRestore = async (gatewayId: number, gatewayName: string) => {
    setLoading(true)
    const [_, err] = await restoreGatewayReq(gatewayId)
    setLoading(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    message.success(`${gatewayName} has been restored`)
    getGatewayConfigList()
    updateGatewayInStore()
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
      .forEach((g: TGateway) => (g.id = g.gatewayId > 0 ? `gateway-${g.gatewayId}` : `gateway-new-${g.gatewayName}`))

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
        (() => {
          // Find gateway by ID first (for existing gateways), then by name (for new gateways)
          const selectedGateway = selectedGatewayId > 0
            ? gatewayConfigList.find((i) => i.gatewayId === selectedGatewayId)
            : gatewayConfigList.find((i) => i.gatewayName === selectedGatewayName)

          if (!selectedGateway) return null

          return selectedGateway.gatewayName !== 'wire_transfer' ? (
            <PaymentGatewaySetupModal
              gatewayConfig={selectedGateway}
              closeModal={() => toggleSetupModal()}
              refresh={getGatewayConfigList}
              updateGatewayInStore={updateGatewayInStore}
              isDuplicateMode={isDuplicateMode}
            />
          ) : (
            <ModalWireTransfer
              gatewayConfig={selectedGateway}
              closeModal={() => toggleSetupModal()}
              refresh={getGatewayConfigList}
              updateGatewayInStore={updateGatewayInStore}
            />
          )
        })()}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {item.gatewayWebsiteLink == '' ? (
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
                        )}
                        {item.isDefault && (
                          <Tag
                            icon={<StarFilled />}
                            color="#1677ff"
                            style={{
                              backgroundColor: '#e6f4ff',
                              borderColor: '#91caff',
                              color: '#1677ff',
                              fontSize: '12px',
                              fontWeight: 500,
                              borderRadius: '12px',
                              padding: '2px 8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            Default
                          </Tag>
                        )}
                        {item.archive && (
                          <Tag
                            icon={<StarFilled />}
                            color="#ff4d4f"
                            style={{
                              backgroundColor: '#fff2f0',
                              borderColor: '#ffccc7',
                              color: '#ff4d4f',
                              fontSize: '12px',
                              fontWeight: 500,
                              borderRadius: '12px',
                              padding: '2px 8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            Archive
                          </Tag>
                        )}
                      </div>
                    }
                    description={item.description}
                  />
                  <div className="mr-3 flex w-[240px] items-center justify-between">
                    {item.IsSetupFinished ? (
                      <Tag icon={<CheckOutlined />} color="#34C759">
                        Ready
                      </Tag>
                    ) : (
                      <Tag icon={<ExclamationOutlined />} color="#AEAEB2">
                        Not Set
                      </Tag>
                    )}
                    <div
                      className="flex gap-2"
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <Button
                        className="btn-gateway-config"
                        data-gateway-id={item.gatewayId}
                        data-gateway-name={item.gatewayName}
                        data-action="duplicate"
                        type="default"
                        size="small"
                        disabled={item.gatewayName === 'wire_transfer' || item.archive || !item.IsSetupFinished} // wire_transfer, archive state or not setup finished disabled button show
                        onClick={(e) => {
                          e.stopPropagation()
                          if (item.gatewayName !== 'wire_transfer') {
                            toggleSetupModal(item.gatewayId, item.gatewayName, true)
                          }
                        }}
                      >
                        Duplicate
                      </Button>
                      <Button
                        className="btn-gateway-config"
                        data-gateway-id={item.gatewayId}
                        data-gateway-name={item.gatewayName}
                        data-action={item.IsSetupFinished ? 'edit' : 'setup'}
                        type={item.IsSetupFinished ? 'default' : 'primary'}
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleSetupModal(item.gatewayId, item.gatewayName, false)
                        }}
                      >
                        {item.IsSetupFinished ? 'Edit' : 'Set up'}
                      </Button>
                      {item.IsSetupFinished && (
                        <Dropdown
                          menu={{
                            items: [
                              {
                                key: 'setDefault',
                                label: (
                                  <span style={{ color: item.archive ? '#d9d9d9' : 'inherit' }}>
                                    {item.isDefault ? 'Default Gateway' : 'Set as Default'}
                                  </span>
                                ),
                                icon: item.isDefault ?
                                  <StarFilled style={{ color: item.archive ? '#d9d9d9' : '#faad14' }} /> :
                                  <StarOutlined style={{ color: item.archive ? '#d9d9d9' : 'inherit' }} />,
                                disabled: item.archive || item.isDefault, // Archived or already default cannot be set as default
                                onClick: () => !item.isDefault && handleSetAsDefault(item.gatewayId, item.name)
                              },
                              ...(item.archive ? [{
                                key: 'restore',
                                label: 'Restore',
                                icon: <UndoOutlined />,
                                onClick: () => handleRestore(item.gatewayId, item.name)
                              }] : [{
                                key: 'archive',
                                label: 'Archive',
                                icon: <DeleteOutlined />,
                                onClick: () => handleArchive(item.gatewayId, item.name)
                              }])
                            ]
                          }}
                          trigger={['click']}
                        >
                          <Button
                            type="text"
                            size="small"
                            icon={<MoreOutlined />}
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation()
                              e.preventDefault()
                            }}
                          />
                        </Dropdown>
                      )}
                    </div>
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
