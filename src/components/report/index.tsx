import {
  DeleteOutlined,
  LoadingOutlined,
  PlusOutlined,
  SaveOutlined
} from '@ant-design/icons'
import type { DatePickerProps, RadioChangeEvent } from 'antd'
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  Radio,
  Row,
  Select,
  Spin,
  Tag,
  Tooltip,
  message
} from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import update from 'immutability-helper'
import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import {
  DragDropContext,
  Draggable,
  DropResult,
  Droppable
} from 'react-beautiful-dnd'
import {
  exportDataReq,
  getExportFieldsWithMore,
  getExportTmplReq,
  removeExportTmplReq,
  saveExportTmplReq
} from '../../requests'
import { TExportDataType } from '../../shared.types'
import { useAppConfigStore } from '../../stores'
import { fuzzyMatch } from './helpers'
import './index.css'

interface TExpTmplPayload {
  reportTimeStart: number
  reportTimeEnd: number
}

type TExpTmpl = {
  templateId: number
  name: string
  createTime: string
  task: TExportDataType
  payload: TExpTmplPayload
  exportColumns: string[]
  format: 'csv' | 'xlsx'
}

type TExportField = {
  name: string
  id: string
  node: ReactNode | null
}

type TFieldComment = {
  [key: string]: string
}
type TFieldHeader = {
  [key: string]: string
}

const Index = () => {
  const appConfig = useAppConfigStore()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const allFields = useRef<TExportField[]>([])
  const fieldComments = useRef<TFieldComment>({})
  const fieldHeaders = useRef<TFieldHeader>({})
  const [availableFields, setAvailableFields] = useState<TExportField[]>([])
  const [fields, setFields] = useState<TExportField[]>([])
  const [selectedTmpl, setSelectedTmpl] = useState<number | null>(null)
  const [templates, setTemplates] = useState<TExpTmpl[]>([]) // use ref, no need to save in state
  const [newTmplName, setNewTmplName] = useState('')
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv'>('xlsx')
  const [reportTimeStart, setReportTimeStart] = useState<null | Dayjs>(null)
  const [reportTimeEnd, setReportTimeEnd] = useState<null | Dayjs>(null)
  const [searchContent, setSearchContent] = useState('')

  const filteredFields = useMemo(
    () =>
      // Since react-beautiful-dnd only provide index prop as the key for the draggable component
      // we cannot just filter these draggable items directly, as this would disrupt the order of
      // the index of these items. Thus the renderer will set display:none to draggable items which
      // are filtered out.
      availableFields.map((field) => ({
        isHide: !fuzzyMatch(field.name, searchContent),
        field
      })),
    [availableFields, searchContent]
  )

  const onExportFormatChange = (e: RadioChangeEvent) => {
    setExportFormat(e.target.value)
  }

  const settableFields: TExportField[] = [
    /* {
      name: 'Amount To',
      id: 'amountEnd',
      node: <Input />
    }, */
    // { name: 'Amount From', id: 'amountStart', node: <Input ref={} /> },
    {
      name: 'currency',
      id: 'currency',
      node: (
        <Select
          style={{ width: 120 }}
          options={[
            { value: 'EUR', label: 'EUR' },
            { value: 'USD', label: 'USD' },
            { value: 'JPY', label: 'JPY' }
          ]}
        />
      )
    },
    {
      name: 'firstName',
      id: 'firstName',
      node: <Input style={{ width: '240px' }} />
    },
    {
      name: 'lastName',
      id: 'lastName',
      node: <Input style={{ width: '240px' }} />
    }
  ]

  const getFields = async () => {
    setLoading(true)
    const [res, err] = await getExportFieldsWithMore('InvoiceExport', getFields)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    const { exportTmplRes, exportFieldsRes } = res
    const { templates } = exportTmplRes
    setTemplates(templates ?? [])
    const { columns, columnComments, columnHeaders } = exportFieldsRes
    fieldComments.current = columnComments
    fieldHeaders.current = columnHeaders
    const parsedColumns = columns.map((c: string) => {
      const col = settableFields.find((f) => f.id == c)
      if (col != null) {
        return col
      } else {
        return { name: c, id: c, node: null }
      }
    })
    setAvailableFields(parsedColumns)
    allFields.current = parsedColumns
  }

  const AddCommentTip = ({
    children,
    fieldName
  }: {
    children: React.ReactNode
    fieldName: string
  }) => {
    return (
      <Tooltip title={fieldComments.current[fieldName]}>{children}</Tooltip>
    )
  }

  const removeField = (fieldId: string) => () => {
    const idx = fields.findIndex((f) => f.id == fieldId)
    if (idx != -1) {
      setAvailableFields(update(availableFields, { $push: [fields[idx]] }))
      setFields(update(fields, { $splice: [[idx, 1]] }))
    }
  }

  const reportRangeChange =
    (
      dateType: 'reportTimeStart' | 'reportTimeEnd'
    ): DatePickerProps['onChange'] =>
    (date) => {
      if (dateType == 'reportTimeStart') {
        if (date != null) {
          date = date.hour(0).minute(0).second(0)
        }
        setReportTimeStart(date)
      } else if (dateType == 'reportTimeEnd') {
        if (date != null) {
          date = date.hour(23).minute(59).second(59)
        }
        setReportTimeEnd(date)
      }
    }

  const exportReportReq = async () => {
    const exportColumns = fields.map((f) => f.id)
    const payload = { ...form.getFieldsValue(), reportTimeStart, reportTimeEnd }
    if (reportTimeStart != null) {
      payload.reportTimeStart = reportTimeStart.unix()
    }
    if (reportTimeEnd != null) {
      payload.reportTimeEnd = reportTimeEnd.unix()
    }
    if (
      reportTimeStart != null &&
      reportTimeEnd != null &&
      reportTimeEnd.isBefore(reportTimeStart)
    ) {
      message.error('Report end date must be later than start date')
      return
    }

    // return
    setExporting(true)
    const [_, err] = await exportDataReq({
      task: 'InvoiceExport',
      payload,
      exportColumns,
      format: exportFormat
    })
    setExporting(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success(
      'Report is being exported, please check task list for progress.'
    )
    appConfig.setTaskListOpen(true)
  }

  const onSelectTmpl = (tmplId: number) => {
    const tmpl = templates.find((t) => t.templateId == tmplId)
    if (!tmpl) {
      return
    }
    setSelectedTmpl(tmplId)
    setExportFormat(tmpl.format)
    const cols = tmpl.exportColumns ?? []
    const newAvailableFields = allFields.current.filter(
      (f) => cols.findIndex((c) => c == f.id) == -1
    )
    const newFields = cols
      .map((c) => {
        const f = allFields.current.find((field) => field.id == c)
        return f
      })
      .filter((c) => c != null)
    setAvailableFields(newAvailableFields)
    setFields(newFields as TExportField[])
    // without the 'as TExportField', TS'll complain: Type '(TExportField | undefined)[]' is not assignable to type 'TExportField[]'.
    // but I already filtered out the undefined items, why still complain?
    if (tmpl.payload == null) {
      return
    }
    if (tmpl.payload.reportTimeStart != null) {
      setReportTimeStart(dayjs.unix(tmpl.payload.reportTimeStart))
    }
    if (tmpl.payload.reportTimeEnd != null) {
      setReportTimeEnd(dayjs.unix(tmpl.payload.reportTimeEnd))
    }
    const fieldValues = JSON.parse(JSON.stringify(tmpl.payload))
    delete fieldValues.reportTimeStart
    delete fieldValues.reportTimeEnd
    form.setFieldsValue(fieldValues)
  }

  // create new template
  const createTmpl = async () => {
    if (newTmplName.trim() == '') {
      message.error('New template name must not be empty')
      return
    }
    const payload = { ...form.getFieldsValue() }
    if (reportTimeStart != null) {
      payload.reportTimeStart = reportTimeStart.unix()
    }
    if (reportTimeEnd != null) {
      payload.reportTimeEnd = reportTimeEnd.unix()
    }
    setLoading(true)
    const [res, err] = await saveExportTmplReq({
      name: newTmplName,
      task: 'InvoiceExport',
      payload,
      exportColumns: fields.map((f) => f.id),
      format: exportFormat
    })
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success('New preset created')
    setSelectedTmpl(res.template.templateId)
    setNewTmplName('')

    // actually, I don't need to call this, just append the createNewTmpl res to the templates array.
    const [res2, err2] = await getExportTmplReq({
      task: 'InvoiceExport',
      page: 0,
      count: 100
    })
    if (null != err2) {
      message.error(err2.message)
      return
    }
    const { templates } = res2
    setTemplates(templates)
  }

  const saveTmpl = async () => {
    if (selectedTmpl == null) {
      return
    }
    const payload = { ...form.getFieldsValue() }
    if (reportTimeStart != null) {
      payload.reportTimeStart = reportTimeStart.unix()
    }
    if (reportTimeEnd != null) {
      payload.reportTimeEnd = reportTimeEnd.unix()
    }
    setLoading(true)
    const [_, err] = await saveExportTmplReq({
      name: templates.find((t) => t.templateId == selectedTmpl)!.name,
      templateId: selectedTmpl,
      task: 'InvoiceExport',
      payload,
      exportColumns: fields.map((f) => f.id),
      format: exportFormat
    })
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success('Preset saved')

    const [res2, err2] = await getExportTmplReq({
      task: 'InvoiceExport',
      page: 0,
      count: 100
    })
    if (null != err2) {
      message.error(err2.message)
      return
    }
    {
      const { templates } = res2
      setTemplates(templates)
    }
  }

  const removeTmpl = async () => {
    if (selectedTmpl == null) {
      return
    }
    setLoading(true)
    const [_, err] = await removeExportTmplReq({
      templateId: selectedTmpl
    })
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    message.success('Preset removed')

    const [res2, err2] = await getExportTmplReq({
      task: 'InvoiceExport',
      page: 0,
      count: 100
    })
    if (null != err2) {
      message.error(err2.message)
      return
    }

    const { templates } = res2
    setTemplates(templates ?? [])
    setSelectedTmpl(null)
  }

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result

    if (!destination) {
      return
    }

    if (
      destination.droppableId == 'available-fields' &&
      source.droppableId == 'exported-fields'
    ) {
      return
    }

    // reordering
    if (
      destination.droppableId == source.droppableId &&
      destination.droppableId == 'exported-fields'
    ) {
      // reordering in export-fields

      if (destination.index == source.index) {
        // you are not dragging anything
        return
      }
      const srcItem = fields[source.index]
      let newFields = fields
      if (destination.index > source.index) {
        newFields = update(fields, {
          $splice: [[destination.index + 1, 0, srcItem]]
        })
        newFields = update(newFields, { $splice: [[source.index, 1]] })
      } else {
        newFields = update(fields, {
          $splice: [[destination.index, 0, srcItem]]
        })
        newFields = update(newFields, { $splice: [[source.index + 1, 1]] })
      }

      setFields(newFields)
      return
    }

    if (destination.droppableId == null) {
      return
    }

    // item is dragged from source to dst
    // remove item from source
    const newAvailables = update(availableFields, {
      $splice: [[source.index, 1]]
    })

    // add item in dst
    const item = availableFields.find((f) => f.id == draggableId)
    const newFields = update(fields, {
      $splice: [
        [
          destination.index,
          0,
          { name: item!.name, id: item!.id, node: item!.node }
        ]
      ]
    })

    setAvailableFields(newAvailables)
    setFields(newFields)
  }

  useEffect(() => {
    getFields()
  }, [])

  return (
    <div>
      <div className="mb-5 flex justify-between">
        <div>
          <Input.Search
            placeholder="Input tag name"
            onInput={(e) => setSearchContent(e.currentTarget.value)}
            // Support users in reset search result using the clear button
            onSearch={(value) => setSearchContent(value)}
            allowClear
          />
        </div>
        <div className="flex">
          <div className="mr-6 flex">
            <Input
              value={newTmplName}
              onChange={(evt) => setNewTmplName(evt.target.value)}
            />
            <Tooltip title="New preset">
              <Button
                disabled={loading || exporting}
                onClick={createTmpl}
                icon={<PlusOutlined />}
                style={{ padding: 0, border: 'none' }}
              ></Button>
            </Tooltip>
          </div>
          <div>
            <span>Preset: </span>
            <Select
              disabled={loading || exporting}
              onChange={onSelectTmpl}
              value={selectedTmpl}
              style={{ width: '180px' }}
              options={templates.map((t) => ({
                value: t.templateId,
                label: t.name
              }))}
            />
          </div>
          <Button
            style={{ padding: 0, border: 'none' }}
            icon={<SaveOutlined />}
            onClick={saveTmpl}
            disabled={loading || exporting}
          ></Button>
          <Button
            onClick={removeTmpl}
            style={{ padding: 0, border: 'none' }}
            icon={<DeleteOutlined />}
            disabled={loading || exporting}
          ></Button>
        </div>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <Spin
          spinning={loading}
          indicator={<LoadingOutlined spin />}
          size={'large'}
        >
          <div
            className="available-fields"
            style={{ minHeight: '80px', maxHeight: '120px', overflowY: 'auto' }}
          >
            <Droppable droppableId="available-fields">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="flex flex-wrap gap-2"
                >
                  {filteredFields.map(({ field, isHide }, idx) => (
                    <Draggable
                      key={field.id}
                      draggableId={field.id.toString()}
                      index={idx}
                    >
                      {(provided) => (
                        <div
                          className={`${isHide && 'hidden'}`}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          ref={provided.innerRef}
                        >
                          {field.node == null ? (
                            <AddCommentTip fieldName={field.name}>
                              <Tag>{fieldHeaders.current[field.name]}</Tag>
                            </AddCommentTip>
                          ) : (
                            <AddCommentTip fieldName={field.name}>
                              <Tag color="blue">
                                {fieldHeaders.current[field.name]}
                              </Tag>
                            </AddCommentTip>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </Spin>
        <div className="my-6 flex items-center justify-center">
          <span className="mr-2">Report from/to:</span>
          <DatePicker
            value={reportTimeStart}
            onChange={reportRangeChange('reportTimeStart')}
            disabled={loading || exporting}
          />
          &nbsp;&nbsp;&nbsp;
          <DatePicker
            value={reportTimeEnd}
            onChange={reportRangeChange('reportTimeEnd')}
            disabled={loading || exporting}
          />
          <div className="mx-4">
            <span className="mx-2">Export format: </span>
            <Radio.Group
              onChange={onExportFormatChange}
              value={exportFormat}
              disabled={loading || exporting}
            >
              <Radio value={'xlsx'}>Excel xlsx</Radio>
              <Radio value={'csv'}>CSV</Radio>
            </Radio.Group>
          </div>
        </div>

        <Row className="mb-2">
          <Col span={8} className="font-bold">
            Fields
          </Col>
          <Col span={12} className="font-bold">
            Settings
          </Col>
          {/* <Col span={4} className="font-bold">
              Hidden
            </Col> */}
        </Row>
        <div
          className="my-4 p-2"
          style={{
            border: '1px solid #eee',
            borderRadius: '4px',
            minHeight: '160px',
            maxHeight: 'calc(100vh - 540px)',
            overflowY: 'auto'
          }}
        >
          <Form form={form} disabled={loading || exporting}>
            <Row>
              <Col span={8}>
                <Droppable droppableId="exported-fields">
                  {(provided, snapshot) => (
                    <div
                      className="exported-fields px-2"
                      style={{
                        minHeight: '420px',
                        // maxHeight: '420px',
                        // height: '600px',
                        // overflowY: 'auto',
                        background: '#F5F5F5',
                        marginRight: '24px',
                        border: snapshot.isDraggingOver
                          ? '1px solid #bbdefb'
                          : '1px solid #F5F5F5'
                      }}
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      <div>
                        {fields.map((f, idx) => (
                          <Draggable
                            key={f.id}
                            draggableId={f.id.toString()}
                            index={idx}
                          >
                            {(provided, snapshot) => (
                              <div
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                ref={provided.innerRef}
                              >
                                <div className="flex items-center">
                                  <Button
                                    size="small"
                                    icon={<DeleteOutlined />}
                                    style={{
                                      border: 'unset',
                                      padding: 0,
                                      background: 'unset'
                                    }}
                                    onClick={removeField(f.id)}
                                  />

                                  <div
                                    className="droppable-field flex w-full items-center pl-2"
                                    style={{
                                      borderRadius: '4px', // snapshot.isDragging ? '1px solid g'
                                      height: '42px',
                                      background: snapshot.isDragging
                                        ? '#bbdefb'
                                        : '#F5F5F5'
                                    }}
                                  >
                                    <AddCommentTip fieldName={f.name}>
                                      {fieldHeaders.current[f.name]}
                                    </AddCommentTip>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                      </div>
                      <div style={{ height: '42px' }}>
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              </Col>
              <Col span={12}>
                {fields.map((f) => (
                  <div
                    className="flex items-center"
                    style={{ height: '42px' }}
                    key={f.id}
                  >
                    {f.node != null && (
                      <Form.Item noStyle={true} name={f.id}>
                        {f.node}
                      </Form.Item>
                    )}
                  </div>
                ))}
              </Col>
              {/* <Col span={4}>
                {fields.map((f) => (
                  <div style={{ height: '42px' }} key={f.id}>
                    <Switch defaultChecked={false} size="small" />
                  </div>
                ))}
              </Col> */}
            </Row>
          </Form>
        </div>
      </DragDropContext>
      <div className="flex items-center justify-end gap-4">
        <Button
          type="primary"
          onClick={exportReportReq}
          loading={exporting}
          disabled={exporting || loading}
        >
          Export
        </Button>
      </div>
    </div>
  )
}

export default Index
