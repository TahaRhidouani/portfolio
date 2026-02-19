import { fetchResume, updateMainData, updateResumeLocation } from "@/app/dashboard/actions";
import { Data } from "@/types";
import { EllipsisOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Card, ColorPicker, Divider, Dropdown, Flex, Form, Input, message, Popover, Space } from "antd";
import { useState } from "react";

export function Main({ data }: { data: Data }) {
  const [messageApi, contextHolder] = message.useMessage();

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [openResumeEdit, setOpenResumeEdit] = useState(false);

  const handleSave = async (values: { position: string; theme: string }) => {
    setLoading(true);
    const res = await updateMainData({
      position: values.position,
      theme: values.theme,
    });
    res.error ? messageApi.error(res.message) : messageApi.success(res.message);
    setLoading(false);
  };

  const handleResumeSave = async () => {
    setResumeLoading(true);
    const val = document.querySelector<HTMLInputElement>('[name="resume"]')!.value;
    const res = await updateResumeLocation(val);
    res.error ? messageApi.error(res.message) : messageApi.success(res.message);
    setResumeLoading(false);
    setOpenResumeEdit(false);
  };

  return (
    <Card type="inner" title="Main" extra={<Button icon={<SaveOutlined />} loading={loading} onClick={form.submit} />}>
      {contextHolder}
      <Form form={form} initialValues={{ theme: data.theme, position: data.position }} onFinish={handleSave}>
        <Form.Item label="Theme color" name="theme">
          <ColorPicker showText={(color) => <span>{color.toHexString()}</span>} disabledAlpha />
        </Form.Item>
        <Form.Item label="Position name" name="position">
          <Input />
        </Form.Item>
      </Form>

      <Divider />

      <Flex align="flex-start" gap="small">
        <Popover
          open={openResumeEdit}
          onOpenChange={setOpenResumeEdit}
          trigger="click"
          placement="topLeft"
          content={
            <Flex gap="middle" vertical>
              <Input defaultValue={data.resumeLocation} name="resume" />
              <Flex gap="small">
                <Button type="primary" loading={resumeLoading} onClick={handleResumeSave}>
                  Save
                </Button>
                <Button onClick={() => setOpenResumeEdit(false)}>Cancel</Button>
              </Flex>
            </Flex>
          }
        >
          <Space.Compact>
            <Button
              type="primary"
              loading={resumeLoading}
              onClick={async () => {
                setResumeLoading(true);
                const res = await fetchResume();
                res.error ? messageApi.error(res.message) : messageApi.success(res.message);
                setResumeLoading(false);
              }}
            >
              Fetch Resume
            </Button>
            <Dropdown
              menu={{
                items: [{ key: "edit", label: "Edit resume location" }],
                onClick: (e) => e.key === "edit" && setOpenResumeEdit(true),
              }}
              placement="bottomRight"
            >
              <Button type="primary" icon={<EllipsisOutlined />} />
            </Dropdown>
          </Space.Compact>
        </Popover>
        <Button href="/api/resume" target="_blank">
          View Resume
        </Button>
      </Flex>
    </Card>
  );
}
