"use client";

import { fetchProjects, fetchResume, updateAboutMe, updateAchievements, updateJobData, updateMainData, updateProjects, updateResumeLocation } from "@/app/dashboard/actions";
import { formatDate } from "@/lib/formatText";
import { Achievement, Achievements, Data, DateType, Dates, Jobs, Project, Projects } from "@/types";
import { CloseOutlined, PlusOutlined, SaveOutlined, SyncOutlined } from "@ant-design/icons";
import { DndContext, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Button,
  Card,
  Collapse,
  ColorPicker,
  ConfigProvider,
  DatePicker,
  Divider,
  Dropdown,
  Flex,
  Form,
  Input,
  Layout,
  Popover,
  RowProps,
  Space,
  Switch,
  Table,
  Tooltip,
  Transfer,
  Typography,
  Upload,
  message,
  theme,
} from "antd";
import dayjs from "dayjs";
import { signOut } from "next-auth/react";
import React, { useRef, useState } from "react";

export function Dashboard({ data }: { data: Data }) {
  const [messageApi, contextHolder] = message.useMessage();

  const [mainForm] = Form.useForm();
  const [workForm] = Form.useForm();
  const [achievementsForm] = Form.useForm();

  const [loadings, setLoadings] = useState<{ [id: string]: boolean }>({});
  const [openResumeLocationEdit, setOpenResumeLocationEdit] = useState<boolean>(false);
  const [jobData, setJobData] = useState<{
    currId: number;
    ids: number[];
    jobLogos: { [id: number]: any };
    jobPreviews: { [id: number]: any };
    dates: { [id: number]: Dates };
    colors: { [id: number]: any };
  }>({
    currId: data.jobs.length - 1,
    ids: [...Array(data.jobs.length).keys()],
    jobLogos: data.jobs.reduce((acc: { [id: number]: any }, obj, index) => {
      if (obj.logo) {
        acc[index] = { uid: index.toString(), status: "done", name: obj.company, url: obj.logo };
      }
      return acc;
    }, {}),
    jobPreviews: data.jobs.reduce((acc: { [id: number]: any }, obj, index) => {
      if (obj.preview) {
        acc[index] = { uid: index.toString(), status: "done", name: obj.company, url: obj.preview };
      }
      return acc;
    }, {}),
    dates: data.jobs.reduce((acc: { [id: number]: any }, obj, index) => {
      if (obj.date) {
        acc[index] = obj.date;
      }
      return acc;
    }, {}),
    colors: data.jobs.reduce((acc: { [id: number]: any }, obj, index) => {
      if (obj.colors?.length === 3) {
        acc[index] = { 0: obj.colors[0], 1: obj.colors[1], 2: obj.colors[2] };
      } else {
        acc[index] = { 0: "#000000", 1: "#000000", 2: "#000000" };
      }
      return acc;
    }, {}),
  });
  const [projectData, setProjectData] = useState<{
    projects: (Project & { key: string })[];
    target: React.Key[];
    selected: React.Key[];
  }>(getProjectData(data.projects.selected.concat(data.projects.other)));
  const [achievementData, setAchievementData] = useState<(Achievement & { logoData?: any })[]>(
    data.achievements.map((a, i) => ({
      ...a,
      logoData: [{ uid: i.toString(), status: "done", name: "achievement-logo-" + i, url: a.logo }],
    }))
  );

  function getProjectData(projects: Projects) {
    return {
      projects: projects.map((project) => {
        return { ...project, key: project.repoName };
      }),
      target: projects.filter((project) => project.selected).map((project) => project.repoName),
      selected: [],
    };
  }

  function showNotification(error: boolean, message: string) {
    messageApi.open({
      type: error ? "error" : "success",
      content: message,
    });
  }

  const sensors = useSensors(
    useSensor(TouchSensor),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1,
      },
    })
  );

  const validImages = ["image/jpeg", "image/jpg", "image/webp", "image/gif", "image/png"];
  const validVideos = ["video/mp4", "video/webm"];

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: data?.theme
          ? {
              colorPrimary: data.theme,
              colorLink: data.theme,
            }
          : undefined,
      }}
    >
      {contextHolder}
      <Layout style={{ minHeight: "100vh" }}>
        <Layout.Content style={{ padding: "16px", marginBlock: "100px" }}>
          <Card style={{ width: "min-content", margin: "0px auto 20px auto" }}>
            <Flex gap="middle">
              <Button type="primary" href="/" target="_blank">
                View portfolio
              </Button>
              <Button onClick={() => signOut()}>Sign out</Button>
            </Flex>
          </Card>

          <Space direction="vertical" size="middle" style={{ display: "flex", maxWidth: "800px", margin: "auto" }}>
            <Card
              type="inner"
              title="Main"
              size="default"
              extra={
                <Button
                  icon={<SaveOutlined />}
                  loading={loadings["main"]}
                  onClick={() => {
                    mainForm.submit();
                  }}
                />
              }
            >
              <Form
                form={mainForm}
                name="main-form"
                autoComplete="off"
                onFinish={(values) => {
                  setLoadings({
                    ...loadings,
                    ["main"]: true,
                  });

                  updateMainData({
                    position: values.position,
                    theme: values.theme.toHexString(),
                  }).then((res) => {
                    showNotification(res.error, res.message);
                    setLoadings({
                      ...loadings,
                      ["main"]: false,
                    });
                  });
                }}
              >
                <Form.Item label="Theme color" name="theme">
                  <ColorPicker defaultValue={data.theme} showText={(color) => <span>{color.toHexString()}</span>} disabledAlpha />
                </Form.Item>

                <Form.Item label="Position name" name="position">
                  <Input defaultValue={data.position} />
                </Form.Item>
              </Form>

              <Divider />

              <Flex align="flex-start" gap="small">
                <Popover
                  content={
                    <Flex align="flex-start" gap="middle" vertical>
                      <Input addonBefore="Document ID" defaultValue={data.resumeLocation} name={"resume"} />

                      <Flex align="flex-start" gap="small">
                        <Button
                          type="primary"
                          loading={loadings["resume-location"]}
                          onClick={() => {
                            setLoadings({ ...loadings, ["resume-location"]: true });
                            setOpenResumeLocationEdit(false);
                            updateResumeLocation(document.querySelector<HTMLInputElement>('[name="resume"]')!.value).then((res) => {
                              showNotification(res.error, res.message);
                              setLoadings({
                                ...loadings,
                                ["resume-location"]: false,
                              });
                            });
                          }}
                        >
                          Save changes
                        </Button>
                        <Button onClick={() => setOpenResumeLocationEdit(false)}>Cancel</Button>
                      </Flex>
                    </Flex>
                  }
                  title="Edit resume location"
                  trigger="contextMenu"
                  placement="topLeft"
                  open={openResumeLocationEdit}
                  onOpenChange={(newOpen: boolean) => setOpenResumeLocationEdit(newOpen)}
                >
                  <Dropdown.Button
                    type="primary"
                    loading={loadings["resume"]}
                    style={{ width: "auto" }}
                    menu={{
                      items: [{ key: "0", label: "Edit resume location" }],
                      onClick: (e) => {
                        if (e.key === "0") {
                          setOpenResumeLocationEdit(true);
                        }
                      },
                    }}
                    onClick={() => {
                      setLoadings({ ...loadings, ["resume"]: true });
                      fetchResume().then((res) => {
                        showNotification(res.error, res.message);
                        setLoadings({ ...loadings, ["resume"]: false });
                      });
                    }}
                  >
                    Fetch Resume
                  </Dropdown.Button>
                </Popover>
                <Button href={"/api/resume"} target={"_blank"}>
                  View Resume
                </Button>
              </Flex>
            </Card>

            <Card
              type="inner"
              title="About Me"
              size="default"
              extra={
                <Button
                  icon={<SaveOutlined />}
                  loading={loadings["about-me"]}
                  onClick={() => {
                    setLoadings({
                      ...loadings,
                      ["about-me"]: true,
                    });
                    updateAboutMe(document.querySelector<HTMLTextAreaElement>('[name="about-me"]')!.value).then((res) => {
                      showNotification(res.error, res.message);
                      setLoadings({
                        ...loadings,
                        ["about-me"]: false,
                      });
                    });
                  }}
                />
              }
            >
              <Flex align="flex-start" gap="middle" vertical>
                <Input.TextArea rows={8} defaultValue={data.about} name={"about-me"} />
                <Tooltip
                  placement="left"
                  title={
                    <>
                      <Typography.Text>Greeting: %G%</Typography.Text> <br />
                      <Typography.Text>Age: %A%</Typography.Text> <br />
                      <Typography.Text>Highlight: ##Sample text##</Typography.Text>
                    </>
                  }
                >
                  <Typography.Link>Need help formatting?</Typography.Link>
                </Tooltip>
              </Flex>
            </Card>

            <Card type="inner" title="Work" size="default" extra={<Button icon={<SaveOutlined />} loading={loadings["jobs"]} onClick={() => workForm.submit()} />}>
              <Form
                labelCol={{ span: 6 }}
                form={workForm}
                name="work-form"
                autoComplete="off"
                onFinish={(values) => {
                  const jobs: Jobs = [];

                  values.jobs.forEach((job: any, index: number) => {
                    jobs.push({
                      company: job?.company,
                      position: job?.position,
                      type: job?.type,
                      date: jobData.dates[jobData.ids[index]],
                      description: job?.description,
                      logo: jobData.jobLogos[jobData.ids[index]]?.url,
                      preview: jobData.jobPreviews[jobData.ids[index]]?.url,
                      previewType: jobData.jobPreviews[jobData.ids[index]]?.type,
                      colors: Object.values(jobData.colors[jobData.ids[index]] ?? {}),
                      repoUrl: job?.repoUrl,
                      websiteUrl: job?.websiteUrl,
                    });
                  });

                  setLoadings({
                    ...loadings,
                    ["jobs"]: true,
                  });

                  updateJobData(jobs).then((res) => {
                    showNotification(res.error, res.message);
                    setLoadings({
                      ...loadings,
                      ["jobs"]: false,
                    });
                  });
                }}
              >
                <Form.List name="jobs" initialValue={data.jobs}>
                  {(fields, { add, remove }) => (
                    <div style={{ display: "flex", rowGap: 16, flexDirection: "column" }}>
                      {fields.map((field) => (
                        <Collapse
                          key={field.key}
                          size="large"
                          items={[
                            {
                              key: field.key,
                              label: data.jobs[field.key]?.company ?? "Untitled job",
                              extra: (
                                <CloseOutlined
                                  onClick={() => {
                                    remove(field.name);
                                    setJobData({
                                      ...jobData,
                                      ids: jobData.ids.filter((id: number) => id !== field.key),
                                    });
                                  }}
                                />
                              ),
                              children: (
                                <>
                                  <Form.Item
                                    label="Logo"
                                    valuePropName="fileList"
                                    getValueFromEvent={(e) => {
                                      if (Array.isArray(e)) {
                                        return e;
                                      }
                                      return e?.fileList;
                                    }}
                                  >
                                    <Upload
                                      name={"job-logo-" + field.key}
                                      listType="picture-card"
                                      maxCount={1}
                                      fileList={jobData.jobLogos[field.key] ? [jobData.jobLogos[field.key]] : []}
                                      showUploadList={{ showPreviewIcon: false }}
                                      beforeUpload={(file) => false}
                                      onChange={(file) => {
                                        if (file.fileList.length === 0) {
                                          setJobData({
                                            ...jobData,
                                            jobLogos: {
                                              ...jobData.jobLogos,
                                              [field.key]: undefined,
                                            },
                                          });
                                        } else if (file.fileList[0].size! / 1024 / 1024 > 15) {
                                          showNotification(true, "Please upload an image smaller than 15MB");
                                        } else if (!validImages.includes(file.fileList[0].type!)) {
                                          showNotification(true, "Please upload a valid image");
                                        } else {
                                          let reader = new FileReader();
                                          reader.onload = (e) => {
                                            let fileData = {
                                              ...file.fileList[0],
                                              url: e.target!.result,
                                            };

                                            setJobData({
                                              ...jobData,
                                              jobLogos: {
                                                ...jobData.jobLogos,
                                                [field.key]: fileData,
                                              },
                                            });
                                          };

                                          reader.readAsDataURL(file.fileList[0].originFileObj as Blob);
                                        }
                                      }}
                                    >
                                      <button
                                        style={{
                                          border: 0,
                                          background: "none",
                                          color: "white",
                                        }}
                                        type="button"
                                      >
                                        {jobData.jobLogos[field.key] ? (
                                          <>
                                            <SyncOutlined />
                                            <div style={{ marginTop: 8 }}>Replace</div>
                                          </>
                                        ) : (
                                          <>
                                            <PlusOutlined />
                                            <div style={{ marginTop: 8 }}>Upload</div>
                                          </>
                                        )}
                                      </button>
                                    </Upload>
                                  </Form.Item>

                                  <Form.Item label="Company" name={[field.name, "company"]}>
                                    <Input />
                                  </Form.Item>

                                  <Form.Item label="Position" name={[field.name, "position"]}>
                                    <Input />
                                  </Form.Item>

                                  <Form.Item label="Type" name={[field.name, "type"]}>
                                    <Input />
                                  </Form.Item>

                                  <JobDate
                                    date={data.jobs[field.key]?.date}
                                    setDate={(date) => {
                                      setJobData({
                                        ...jobData,
                                        dates: {
                                          ...jobData.dates,
                                          [field.key]: date,
                                        },
                                      });
                                    }}
                                  />

                                  <Form.Item label="Description" name={[field.name, "description"]} tooltip={"Separate entries with a '-'"}>
                                    <Input.TextArea rows={6} />
                                  </Form.Item>

                                  <Form.Item
                                    label="Preview"
                                    valuePropName="fileList"
                                    getValueFromEvent={(e) => {
                                      if (Array.isArray(e)) {
                                        return e;
                                      }
                                      return e?.fileList;
                                    }}
                                  >
                                    <Upload
                                      name={"job-preview-" + field.key}
                                      listType="picture-card"
                                      maxCount={1}
                                      fileList={jobData.jobPreviews[field.key] ? [jobData.jobPreviews[field.key]] : []}
                                      showUploadList={{ showPreviewIcon: false }}
                                      beforeUpload={(file) => false}
                                      onChange={(file) => {
                                        const isImage = validImages.includes(file.fileList[0].type!);
                                        const isVideo = validVideos.includes(file.fileList[0].type!);

                                        if (file.fileList.length === 0) {
                                          setJobData({
                                            ...jobData,
                                            jobPreviews: {
                                              ...jobData.jobPreviews,
                                              [field.key]: undefined,
                                            },
                                          });
                                        } else if (file.fileList[0].size! / 1024 / 1024 > 15) {
                                          showNotification(true, "Please upload an image smaller than 15MB");
                                        } else if (!isImage && !isVideo) {
                                          showNotification(true, "Please upload a valid image or video");
                                        } else {
                                          let reader = new FileReader();
                                          reader.onload = (e) => {
                                            let fileData = {
                                              ...file.fileList[0],
                                              url: e.target!.result,
                                            };

                                            setJobData({
                                              ...jobData,
                                              jobPreviews: {
                                                ...jobData.jobPreviews,
                                                [field.key]: { ...fileData, type: isImage ? "image" : isVideo ? "video" : null },
                                              },
                                            });
                                          };

                                          reader.readAsDataURL(file.fileList[0].originFileObj as Blob);
                                        }
                                      }}
                                    >
                                      <button
                                        style={{
                                          border: 0,
                                          background: "none",
                                          color: "white",
                                        }}
                                        type="button"
                                      >
                                        {jobData.jobPreviews[field.key] ? (
                                          <>
                                            <SyncOutlined />
                                            <div style={{ marginTop: 8 }}>Replace</div>
                                          </>
                                        ) : (
                                          <>
                                            <PlusOutlined />
                                            <div style={{ marginTop: 8 }}>Upload</div>
                                          </>
                                        )}
                                      </button>
                                    </Upload>
                                  </Form.Item>

                                  <Form.Item label="Theme colors" name={[field.name, "colors"]}>
                                    <Flex gap="middle">
                                      <ColorPicker
                                        format="hex"
                                        disabledAlpha
                                        defaultValue={jobData.colors[field.key]?.[0]}
                                        onChange={(value, hex) => {
                                          setJobData({
                                            ...jobData,
                                            colors: {
                                              ...jobData.colors,
                                              [field.key]: {
                                                ...jobData.colors[field.key],
                                                [0]: hex,
                                              },
                                            },
                                          });
                                        }}
                                      />
                                      <ColorPicker
                                        format="hex"
                                        disabledAlpha
                                        defaultValue={jobData.colors[field.key]?.[1]}
                                        onChange={(value, hex) => {
                                          setJobData({
                                            ...jobData,
                                            colors: {
                                              ...jobData.colors,
                                              [field.key]: {
                                                ...jobData.colors[field.key],
                                                [1]: hex,
                                              },
                                            },
                                          });
                                        }}
                                      />
                                      <ColorPicker
                                        format="hex"
                                        disabledAlpha
                                        defaultValue={jobData.colors[field.key]?.[2]}
                                        onChange={(value, hex) => {
                                          setJobData({
                                            ...jobData,
                                            colors: {
                                              ...jobData.colors,
                                              [field.key]: {
                                                ...jobData.colors[field.key],
                                                [2]: hex,
                                              },
                                            },
                                          });
                                        }}
                                      />
                                    </Flex>
                                  </Form.Item>

                                  <Form.Item label="Repository" name={[field.name, "repoUrl"]}>
                                    <Input />
                                  </Form.Item>

                                  <Form.Item label="Website" name={[field.name, "websiteUrl"]}>
                                    <Input />
                                  </Form.Item>
                                </>
                              ),
                            },
                          ]}
                        />
                      ))}

                      <Button
                        type="dashed"
                        onClick={() => {
                          add();
                          setJobData({
                            ...jobData,
                            currId: jobData.currId + 1,
                            ids: jobData.ids.concat(jobData.currId + 1),
                          });
                        }}
                        block
                      >
                        + Add job
                      </Button>
                    </div>
                  )}
                </Form.List>
              </Form>
            </Card>

            <Card
              type="inner"
              title="Projects"
              size="default"
              extra={
                <Flex gap="middle">
                  <Button
                    icon={<SyncOutlined />}
                    loading={loadings["projects-fetch"]}
                    onClick={() => {
                      setLoadings({
                        ...loadings,
                        ["projects-fetch"]: true,
                      });

                      fetchProjects().then((res) => {
                        showNotification(res.error, res.message);
                        setProjectData(getProjectData(res.data));
                        setLoadings({
                          ...loadings,
                          ["jobs"]: false,
                        });
                      });
                    }}
                  />
                  <Button
                    icon={<SaveOutlined />}
                    loading={loadings["projects"]}
                    onClick={() => {
                      setLoadings({
                        ...loadings,
                        ["projects"]: true,
                      });

                      const selected: Projects = [];
                      projectData.target.forEach((k) => {
                        selected.push(projectData.projects.find((p) => p.key === k) as Project);
                      });

                      const other: Projects = projectData.projects.filter((p) => !projectData.target.includes(p.key));

                      updateProjects(selected, other).then((res) => {
                        showNotification(res.error, res.message);

                        setLoadings({
                          ...loadings,
                          ["projects"]: false,
                        });
                      });
                    }}
                  />
                </Flex>
              }
            >
              <Transfer
                titles={["Projects", "Selected"]}
                showSelectAll={false}
                listStyle={{ width: "100%", height: "auto" }}
                dataSource={projectData.projects}
                targetKeys={projectData.target}
                selectedKeys={projectData.selected}
                onChange={(nextTargetKeys) => {
                  setProjectData({
                    ...projectData,
                    target: nextTargetKeys,
                    selected: [],
                  });
                }}
                onSelectChange={(p, s) => {
                  setProjectData({
                    ...projectData,
                    selected: [...p, ...s],
                  });
                }}
              >
                {({ direction, filteredItems, selectedKeys: listSelectedKeys }) => {
                  return (
                    <DndContext
                      sensors={sensors}
                      modifiers={[restrictToVerticalAxis]}
                      onDragEnd={({ active, over }) => {
                        if (active.id !== over?.id) {
                          if (direction === "left") {
                            const activeIndex = projectData.projects.findIndex((i) => i.key === active.id);
                            const overIndex = projectData.projects.findIndex((i) => i.key === over?.id);

                            setProjectData({
                              ...projectData,
                              projects: arrayMove(projectData.projects, activeIndex, overIndex),
                            });
                          } else {
                            const activeIndex = projectData.target.findIndex((i) => i === active.id);
                            const overIndex = projectData.target.findIndex((i) => i === over?.id);

                            setProjectData({
                              ...projectData,
                              target: arrayMove(projectData.target, activeIndex, overIndex),
                            });
                          }
                        }
                      }}
                    >
                      <SortableContext items={filteredItems.map((i) => i.key)} strategy={verticalListSortingStrategy}>
                        <Table
                          rowSelection={{
                            selectedRowKeys: listSelectedKeys,
                            onSelect: ({ key }) => {
                              const newSelected = [...projectData.selected];
                              const index = newSelected.indexOf(key);

                              if (index !== -1) {
                                newSelected.splice(index, 1);
                              } else {
                                newSelected.push(key);
                              }

                              setProjectData({
                                ...projectData,
                                selected: newSelected,
                              });
                            },
                          }}
                          columns={[
                            {
                              dataIndex: "name",
                              render: (data, entry) => {
                                return (
                                  <Input
                                    placeholder="Project name"
                                    variant="borderless"
                                    defaultValue={data}
                                    onClick={(e) => e.stopPropagation()}
                                    onBlur={(value) => {
                                      let newProjects = [...projectData.projects];
                                      let p = newProjects.find((project) => project.key === entry.key);
                                      p!.name = value.target.value;

                                      setProjectData({
                                        ...projectData,
                                        projects: newProjects,
                                      });
                                    }}
                                  />
                                );
                              },
                            },
                            {
                              dataIndex: "visible",
                              width: 50,
                              render: (data, entry) => {
                                return (
                                  <Switch
                                    defaultChecked={data}
                                    size="small"
                                    onClick={(_, e) => e.stopPropagation()}
                                    onChange={(value) => {
                                      let newProjects = [...projectData.projects];
                                      let p = newProjects.find((project) => project.key === entry.key);
                                      p!.visible = value;

                                      setProjectData({
                                        ...projectData,
                                        projects: newProjects,
                                      });
                                    }}
                                  />
                                );
                              },
                            },
                          ]}
                          components={{
                            body: {
                              row: DragRow,
                            },
                          }}
                          pagination={false}
                          showHeader={false}
                          dataSource={filteredItems}
                          style={{ touchAction: "none" }}
                          size="small"
                          onRow={({ key }) => ({
                            onClick: () => {
                              const newSelected = [...projectData.selected];
                              const index = newSelected.indexOf(key);

                              if (index !== -1) {
                                newSelected.splice(index, 1);
                              } else {
                                newSelected.push(key);
                              }

                              setProjectData({
                                ...projectData,
                                selected: newSelected,
                              });
                            },
                          })}
                        />
                      </SortableContext>
                    </DndContext>
                  );
                }}
              </Transfer>
            </Card>

            <Card
              type="inner"
              title="Achievements"
              size="default"
              extra={
                <Button
                  icon={<SaveOutlined />}
                  loading={loadings["achievements"]}
                  onClick={() => {
                    achievementsForm.submit();
                  }}
                />
              }
            >
              <Form
                labelCol={{ span: 6 }}
                form={achievementsForm}
                name="achievements-form"
                autoComplete="off"
                onFinish={() => {
                  const achievements: Achievements = [];

                  achievementData.forEach((achievement, index) => {
                    if (achievement) {
                      achievements.push({
                        logo: achievement.logo,
                        title: achievement.title,
                        description: achievement.description,
                        url: achievement.url,
                      });
                    }
                  });

                  setLoadings({
                    ...loadings,
                    ["achievements"]: true,
                  });

                  updateAchievements(achievements).then((res) => {
                    showNotification(res.error, res.message);
                    setLoadings({
                      ...loadings,
                      ["achievements"]: false,
                    });
                  });
                }}
              >
                <Form.List name="achievements" initialValue={achievementData}>
                  {(fields, { add, remove }) => (
                    <div style={{ display: "flex", rowGap: 16, flexDirection: "column" }}>
                      {fields.map((field) => (
                        <Collapse
                          key={field.key}
                          size="large"
                          items={[
                            {
                              key: field.key,
                              label: "Entry #" + (field.name + 1),
                              extra: (
                                <CloseOutlined
                                  onClick={() => {
                                    remove(field.name);

                                    const newAchievements = [...achievementData];
                                    newAchievements[field.key] = undefined!;

                                    setAchievementData(newAchievements);
                                  }}
                                />
                              ),
                              children: (
                                <>
                                  <Form.Item
                                    label="Logo"
                                    valuePropName="fileList"
                                    getValueFromEvent={(e) => {
                                      if (Array.isArray(e)) {
                                        return e;
                                      }
                                      return e?.fileList;
                                    }}
                                  >
                                    <Upload
                                      name={"achievement-logo-" + field.key}
                                      listType="picture-card"
                                      maxCount={1}
                                      fileList={achievementData[field.key]?.logoData ?? []}
                                      showUploadList={{ showPreviewIcon: false }}
                                      beforeUpload={(file) => false}
                                      onChange={(file) => {
                                        if (file.fileList.length === 0) {
                                          const newAchievements = [...achievementData];
                                          newAchievements[field.key].logoData = undefined;

                                          setAchievementData(newAchievements);
                                        } else if (file.fileList[0].size! / 1024 / 1024 > 15) {
                                          showNotification(true, "Please upload an image smaller than 15MB");
                                        } else if (!validImages.includes(file.fileList[0].type!)) {
                                          showNotification(true, "Please upload a valid image");
                                        } else {
                                          let reader = new FileReader();
                                          reader.onload = (e) => {
                                            let fileData = {
                                              ...file.fileList[0],
                                              url: e.target!.result,
                                            };

                                            const newAchievements = [...achievementData];
                                            newAchievements[field.key].logoData = [fileData];
                                            newAchievements[field.key].logo = fileData.url as string;

                                            setAchievementData(newAchievements);
                                          };

                                          reader.readAsDataURL(file.fileList[0].originFileObj as Blob);
                                        }
                                      }}
                                    >
                                      <button
                                        style={{
                                          border: 0,
                                          background: "none",
                                          color: "white",
                                        }}
                                        type="button"
                                      >
                                        {achievementData[field.key]?.logoData ? (
                                          <>
                                            <SyncOutlined />
                                            <div style={{ marginTop: 8 }}>Replace</div>
                                          </>
                                        ) : (
                                          <>
                                            <PlusOutlined />
                                            <div style={{ marginTop: 8 }}>Upload</div>
                                          </>
                                        )}
                                      </button>
                                    </Upload>
                                  </Form.Item>

                                  <Form.Item label="Title" name={[field.name, "title"]}>
                                    <Input
                                      onBlur={(value) => {
                                        const newAchievements = [...achievementData];
                                        newAchievements[field.key].title = value.target.value;
                                        setAchievementData(newAchievements);
                                      }}
                                    />
                                  </Form.Item>

                                  <Form.Item label="Description" name={[field.name, "description"]}>
                                    <Input
                                      onBlur={(value) => {
                                        const newAchievements = [...achievementData];
                                        newAchievements[field.key].description = value.target.value;
                                        setAchievementData(newAchievements);
                                      }}
                                    />
                                  </Form.Item>

                                  <Form.Item label="Url" name={[field.name, "url"]}>
                                    <Input
                                      onBlur={(value) => {
                                        const newAchievements = [...achievementData];
                                        newAchievements[field.key].url = value.target.value;
                                        setAchievementData(newAchievements);
                                      }}
                                    />
                                  </Form.Item>
                                </>
                              ),
                            },
                          ]}
                        />
                      ))}

                      <Button
                        type="dashed"
                        onClick={() => {
                          add();

                          const newAchievements = [...achievementData];

                          newAchievements[achievementData.length] = {
                            logo: "",
                            title: "",
                            description: "",
                            url: "",
                          };

                          setAchievementData(newAchievements);
                        }}
                        block
                      >
                        + Add entry
                      </Button>
                    </div>
                  )}
                </Form.List>
              </Form>
            </Card>
          </Space>
        </Layout.Content>
      </Layout>
    </ConfigProvider>
  );
}

export function JobDate({ date, setDate }: { date: Dates; setDate: (date: Dates) => void }) {
  const [currentJob, setCurrentJob] = useState(date?.end?.[0] === "Present");
  const currDate = useRef(date);

  return (
    <Form.Item label="Date">
      <Flex gap="middle" align="center">
        <DatePicker.RangePicker
          picker="month"
          disabled={[false, currentJob]}
          allowEmpty
          defaultValue={date ? [dayjs(formatDate(date.start)), currentJob ? dayjs(new Date()) : dayjs(formatDate(date.end))] : undefined}
          onChange={(values) => {
            if (!values?.[0]) return;

            const start = values[0]
              .format("MMM YYYY")
              .split(" ")
              .map((el, i) => (i === 1 ? parseInt(el) : el)) as DateType;
            const end = (
              currentJob
                ? ["Present"]
                : values[1]
                    ?.format("MMM YYYY")
                    .split(" ")
                    .map((el, i) => (i === 1 ? parseInt(el) : el))
            ) as DateType;

            currDate.current = { start: start, end: end };
            setDate(currDate.current);
          }}
        />
        <Switch
          checkedChildren="Current"
          unCheckedChildren="Ended"
          defaultChecked={currentJob}
          onChange={(checked) => {
            setCurrentJob(checked);
            setDate({
              start: currDate.current?.start,
              end: checked ? ["Present"] : currDate.current?.end,
            });
          }}
        />
      </Flex>
    </Form.Item>
  );
}

function DragRow(props: RowProps & { "data-row-key": string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props["data-row-key"],
  });

  const style: React.CSSProperties = {
    ...props.style,
    transform: CSS.Transform.toString(transform && { ...transform, scaleY: 1 }),
    transition,
    cursor: "move",
    ...(isDragging ? { position: "relative", zIndex: 9999 } : {}),
  };

  return <tr {...props} ref={setNodeRef} style={style} {...attributes} {...listeners} />;
}
