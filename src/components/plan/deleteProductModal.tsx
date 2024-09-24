import { Button, Col, message, Modal, Row } from 'antd'
import update from 'immutability-helper'
import React, { CSSProperties, useState } from 'react'
import { IProduct } from '../../@types/shared.types'
import { deleteProductReq } from '../../requests'
import { useProductListStore } from '../../stores'

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: '24px',
  color: '#424242'
}

interface Props {
  refresh: () => void
  closeModal: () => void
  product: IProduct | undefined
}

const Index = ({ closeModal, refresh, product }: Props) => {
  const productsStore = useProductListStore()
  const [loading, setLoading] = useState(false)

  const onDelete = async () => {
    if (product == null) {
      return
    }
    setLoading(true)
    const [res, err] = await deleteProductReq(product.id)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    refresh()
    closeModal()
    const idx = productsStore.list.findIndex((p) => p.id == product.id)
    if (idx != -1) {
      const list = update(productsStore.list, { $splice: [[idx, 1]] })
      productsStore.setProductList({ list })
    }
  }

  return (
    <Modal
      title="Product delete confirm"
      open={true}
      width={'720px'}
      footer={null}
      closeIcon={null}
    >
      <p>Are you sure you want to delete this product?</p>
      <Row style={rowStyle}>
        <Col span={8}>
          <span style={{ fontWeight: 'bold' }}>Id</span>
        </Col>
        <Col span={16}>{product?.id}</Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={8}>
          <span style={{ fontWeight: 'bold' }}>Name</span>
        </Col>
        <Col span={16}>{product?.productName}</Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={8}>
          <span style={{ fontWeight: 'bold' }}>Description</span>
        </Col>
        <Col span={16}>{product?.description}</Col>
      </Row>
      <div
        className="flex items-center justify-end gap-4"
        style={{
          marginTop: '24px'
        }}
      >
        <Button onClick={closeModal} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={onDelete}
          loading={loading}
          disabled={loading}
        >
          OK
        </Button>
      </div>
    </Modal>
  )
}

export default Index
