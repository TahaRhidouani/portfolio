import { updateAchievements } from "@/app/dashboard/actions";
import { useFileUpload } from "@/components/Dashboard/hooks/useFileUpload";
import { generateId } from "@/lib/id";
import { Achievement, Data } from "@/types";
import { CloseOutlined, PlusOutlined, SaveOutlined, SyncOutlined } from "@ant-design/icons";
import { Button, Card, Collapse, Flex, Form, Input, Upload, message } from "antd";
import { useState } from "react";

export function Achievements({ data }: { data: Data }) {
  const [messageApi, contextHolder] = message.useMessage();
  const { handleUpload } = useFileUpload();
  const [loading, setLoading] = useState(false);

  console.log(data);

  const [achievements, setAchievements] = useState<(Achievement & { _key: string })[]>(
    data.achievements.map((a) => ({
      ...a,
      _key: generateId(),
      logo: a.logo || "",
    })),
  );

  const updateItem = (index: number, field: keyof Achievement, value: string) => {
    setAchievements((prev) => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  };

  const addItem = () => {
    setAchievements((prev) => [...prev, { _key: generateId(), title: "", description: "", url: "", logo: "" }]);
  };

  const removeItem = (index: number) => {
    setAchievements((prev) => prev.filter((_, i) => i !== index));
  };

  const onFinish = async () => {
    setLoading(true);
    const payload = achievements.map(({ _key, ...rest }) => rest);
    const res = await updateAchievements(payload);
    res.error ? messageApi.error(res.message) : messageApi.success(res.message);
    setLoading(false);
  };

  return (
    <Card type="inner" title="Achievements" extra={<Button icon={<SaveOutlined />} loading={loading} onClick={onFinish} />}>
      {contextHolder}
      <Form labelCol={{ span: 6 }}>
        <Flex vertical gap="middle">
          {achievements.map((item, index) => (
            <Collapse
              key={item._key}
              size="large"
              items={[
                {
                  key: "1",
                  label: item.title || `Entry #${index + 1}`,
                  extra: (
                    <CloseOutlined
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(index);
                      }}
                    />
                  ),
                  children: (
                    <>
                      <Form.Item label="Logo">
                        <Upload
                          listType="picture-card"
                          maxCount={1}
                          showUploadList={{ showPreviewIcon: false }}
                          fileList={item.logo ? [{ uid: "-1", name: "logo", status: "done", url: item.logo }] : []}
                          beforeUpload={(f) => {
                            handleUpload(f).then((url) => {
                              if (url) updateItem(index, "logo", url);
                            });
                            return false;
                          }}
                        >
                          <button style={{ border: 0, background: "none" }} type="button">
                            {item.logo ? <SyncOutlined /> : <PlusOutlined />}
                            <div style={{ marginTop: 8 }}>{item.logo ? "Replace" : "Upload"}</div>
                          </button>
                        </Upload>
                      </Form.Item>

                      <Form.Item label="Title">
                        <Input value={item.title} onChange={(e) => updateItem(index, "title", e.target.value)} placeholder="Achievement title" />
                      </Form.Item>

                      <Form.Item label="Description">
                        <Input value={item.description} onChange={(e) => updateItem(index, "description", e.target.value)} />
                      </Form.Item>

                      <Form.Item label="Url">
                        <Input value={item.url} onChange={(e) => updateItem(index, "url", e.target.value)} />
                      </Form.Item>
                    </>
                  ),
                },
              ]}
            />
          ))}

          <Button type="dashed" onClick={addItem} block>
            + Add entry
          </Button>
        </Flex>
      </Form>
    </Card>
  );
}
