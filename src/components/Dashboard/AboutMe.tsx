import { updateAboutMe } from "@/app/dashboard/actions";
import { Data } from "@/types";
import { SaveOutlined } from "@ant-design/icons";
import { Button, Card, Flex, Input, Tooltip, Typography, message } from "antd";
import { useState } from "react";

export function AboutMe({ data }: { data: Data }) {
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(false);
  const [text, setText] = useState(data.about);

  const handleSave = async () => {
    setLoading(true);
    const res = await updateAboutMe(text);
    res.error ? messageApi.error(res.message) : messageApi.success(res.message);
    setLoading(false);
  };

  return (
    <Card type="inner" title="About Me" extra={<Button icon={<SaveOutlined />} loading={loading} onClick={handleSave} />}>
      {contextHolder}
      <Flex gap="middle" vertical>
        <Input.TextArea rows={8} value={text} onChange={(e) => setText(e.target.value)} />
        <Tooltip
          placement="left"
          title={
            <>
              <Typography.Text>Greeting: %G%</Typography.Text>
              <br />
              <Typography.Text>Age: %A%</Typography.Text>
              <br />
              <Typography.Text>Highlight: ##Sample text##</Typography.Text>
            </>
          }
        >
          <Typography.Link>Need help formatting?</Typography.Link>
        </Tooltip>
      </Flex>
    </Card>
  );
}
