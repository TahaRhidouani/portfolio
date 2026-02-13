import { updateJobData } from "@/app/dashboard/actions";
import { useFileUpload } from "@/components/Dashboard/hooks/useFileUpload";
import { generateId } from "@/lib/id";
import { Data, Job } from "@/types";
import { CloseOutlined, PlusOutlined, SaveOutlined, SyncOutlined } from "@ant-design/icons";
import { Button, Card, Collapse, ColorPicker, DatePicker, Flex, Form, Input, Switch, Upload, message } from "antd";
import dayjs from "dayjs";
import { useState } from "react";

export function Work({ data }: { data: Data }) {
  const [messageApi, contextHolder] = message.useMessage();
  const { handleUpload } = useFileUpload();
  const [loading, setLoading] = useState(false);

  const [jobs, setJobs] = useState<(Job & { _key: string })[]>(
    data.jobs.map((j) => ({
      ...j,
      _key: generateId(),
      colors: j.colors || ["#000", "#000", "#000"],
      date: j.date || { start: null, end: null },
    })),
  );

  const updateJob = (index: number, field: string, value: any) => {
    setJobs((prev) => {
      const newJobs = [...prev];
      newJobs[index] = { ...newJobs[index], [field]: value };
      return newJobs;
    });
  };

  const updateJobNested = (index: number, parent: string, childKey: string | number, value: any) => {
    setJobs((prev) => {
      const newJobs = [...prev];
      const parentObj = (newJobs[index] as Record<string, any>)[parent] || {};

      if (Array.isArray(parentObj)) {
        const newArr = [...parentObj];
        newArr[childKey as number] = value;
        newJobs[index] = { ...newJobs[index], [parent]: newArr };
      } else {
        newJobs[index] = { ...newJobs[index], [parent]: { ...parentObj, [childKey]: value } };
      }
      return newJobs;
    });
  };

  const addItem = () => {
    setJobs((prev) => [
      ...prev,
      {
        _key: generateId(),
        company: "",
        position: "",
        logo: "",
        colors: ["#000", "#000", "#000"],
        date: { start: null, end: null },
      },
    ]);
  };

  const removeItem = (index: number) => {
    setJobs((prev) => prev.filter((_, i) => i !== index));
  };

  const onFinish = async () => {
    setLoading(true);
    const payload = jobs.map(({ _key, ...rest }) => rest);
    const res = await updateJobData(payload);
    res.error ? messageApi.error(res.message) : messageApi.success(res.message);
    setLoading(false);
  };

  return (
    <Card type="inner" title="Work" extra={<Button icon={<SaveOutlined />} loading={loading} onClick={onFinish} />}>
      {contextHolder}
      <Form labelCol={{ span: 6 }}>
        <Flex vertical gap="middle">
          {jobs.map((job, index) => (
            <Collapse
              key={job._key}
              size="large"
              items={[
                {
                  key: "1",
                  label: job.company || "New Job",
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
                          fileList={job.logo ? [{ uid: "-1", name: "logo", status: "done", url: job.logo }] : []}
                          beforeUpload={(f) => {
                            handleUpload(f).then((url) => {
                              if (url) updateJob(index, "logo", url);
                            });
                            return false;
                          }}
                        >
                          <button style={{ border: 0, background: "none" }} type="button">
                            {job.logo ? <SyncOutlined /> : <PlusOutlined />}
                            <div style={{ marginTop: 8 }}>{job.logo ? "Replace" : "Upload"}</div>
                          </button>
                        </Upload>
                      </Form.Item>

                      <Form.Item label="Company">
                        <Input value={job.company} onChange={(e) => updateJob(index, "company", e.target.value)} />
                      </Form.Item>

                      <Form.Item label="Position">
                        <Input value={job.position} onChange={(e) => updateJob(index, "position", e.target.value)} />
                      </Form.Item>

                      <Form.Item label="Type">
                        <Input value={job.type} onChange={(e) => updateJob(index, "type", e.target.value)} />
                      </Form.Item>

                      <Form.Item label="Date">
                        <Flex gap="middle" align="center">
                          <DatePicker.RangePicker
                            picker="month"
                            allowEmpty
                            disabled={[false, job.date?.end === "present"]}
                            value={[
                              job.date?.start ? dayjs(job.date.start) : null,
                              job.date?.end === "present" ? dayjs() : job.date?.end ? dayjs(job.date.end) : null,
                            ]}
                            onCalendarChange={(val) => {
                              updateJobNested(index, "date", "start", val[0]?.valueOf() ?? null);
                              if (job.date?.end !== "present") {
                                updateJobNested(index, "date", "end", val[1]?.valueOf() ?? null);
                              }
                            }}
                          />
                          <Switch
                            checked={job.date?.end === "present"}
                            onChange={(checked) => updateJobNested(index, "date", "end", checked ? "present" : null)}
                            checkedChildren="Current"
                            unCheckedChildren="Ended"
                          />
                        </Flex>
                      </Form.Item>

                      <Form.Item label="Description" tooltip="Separate with '-'">
                        <Input.TextArea rows={6} value={job.description} onChange={(e) => updateJob(index, "description", e.target.value)} />
                      </Form.Item>

                      <Form.Item label="Preview">
                        <Upload
                          listType="picture-card"
                          maxCount={1}
                          showUploadList={{ showPreviewIcon: false }}
                          fileList={job.preview ? [{ uid: "-1", name: "preview", status: "done", url: job.preview }] : []}
                          beforeUpload={(f) => {
                            handleUpload(f, true).then((url) => {
                              if (url) {
                                const type = f.type?.includes("video") ? "video" : "image";
                                updateJob(index, "preview", url);
                                updateJob(index, "previewType", type);
                              }
                            });
                            return false;
                          }}
                        >
                          <button style={{ border: 0, background: "none" }} type="button">
                            {job.preview ? <SyncOutlined /> : <PlusOutlined />}
                            <div style={{ marginTop: 8 }}>{job.preview ? "Replace" : "Upload"}</div>
                          </button>
                        </Upload>
                      </Form.Item>

                      <Form.Item label="Theme colors">
                        <Flex gap="small">
                          {[0, 1, 2].map((i) => (
                            <ColorPicker
                              key={i}
                              value={job.colors?.[i]}
                              onChange={(_, hex) => updateJobNested(index, "colors", i, hex)}
                              disabledAlpha
                              disabledFormat
                            />
                          ))}
                        </Flex>
                      </Form.Item>

                      <Form.Item label="Repository">
                        <Input value={job.repoUrl} onChange={(e) => updateJob(index, "repoUrl", e.target.value)} />
                      </Form.Item>

                      <Form.Item label="Website">
                        <Input value={job.websiteUrl} onChange={(e) => updateJob(index, "websiteUrl", e.target.value)} />
                      </Form.Item>
                    </>
                  ),
                },
              ]}
            />
          ))}

          <Button type="dashed" onClick={addItem} block>
            + Add job
          </Button>
        </Flex>
      </Form>
    </Card>
  );
}
