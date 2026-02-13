import { fetchProjects, updateProjects } from "@/app/dashboard/actions";
import { Data, Project } from "@/types";
import { SaveOutlined, SyncOutlined } from "@ant-design/icons";
import { DndContext, DragEndEvent, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button, Card, Flex, Input, Switch, Table, Transfer, message } from "antd";
import { TransferDirection } from "antd/es/transfer";
import { useState } from "react";

const DragRow = ({ children, style, ...props }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props["data-row-key"],
  });

  const dndStyle: React.CSSProperties = {
    ...style,
    transform: CSS.Transform.toString(transform && { ...transform, scaleY: 1 }),
    transition,
    cursor: "move",
    zIndex: isDragging ? 9999 : undefined,
  };

  return (
    <tr {...props} ref={setNodeRef} style={dndStyle} {...attributes} {...listeners}>
      {children}
    </tr>
  );
};

export function Projects({ data }: { data: Data }) {
  const [messageApi, contextHolder] = message.useMessage();

  const [projects, setProjects] = useState<Project[]>(data.projects.selected.concat(data.projects.other).map((p) => ({ ...p, key: p.repoName })));

  const [targetKeys, setTargetKeys] = useState<string[]>(data.projects.selected.map((p) => p.repoName));
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const [loading, setLoading] = useState({ fetch: false, save: false });

  const sensors = useSensors(useSensor(TouchSensor), useSensor(PointerSensor, { activationConstraint: { distance: 1 } }));

  const handleFetch = async () => {
    setLoading((p) => ({ ...p, fetch: true }));
    const res = await fetchProjects();
    if (!res.error) {
      setProjects(res.data.map((p: Project) => ({ ...p, key: p.repoName })));
      messageApi.success(res.message);
    } else {
      messageApi.error(res.message);
    }
    setLoading((p) => ({ ...p, fetch: false }));
  };

  const handleSave = async () => {
    setLoading((p) => ({ ...p, save: true }));
    const selected = targetKeys.map((k) => projects.find((p) => p.repoName === k)!);
    const other = projects.filter((p) => !targetKeys.includes(p.repoName));

    const res = await updateProjects(selected, other);
    res.error ? messageApi.error(res.message) : messageApi.success(res.message);
    setLoading((p) => ({ ...p, save: false }));
  };

  const updateProjectField = (repoName: string, field: keyof Project, val: any) => {
    setProjects((prev) => prev.map((p) => (p.repoName === repoName ? { ...p, [field]: val } : p)));
  };

  const onDragEnd = (direction: TransferDirection, { active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      if (direction === "left") {
        setProjects((prev) => {
          const activeIndex = prev.findIndex((i) => i.repoName === active.id);
          const overIndex = prev.findIndex((i) => i.repoName === over?.id);
          return arrayMove(prev, activeIndex, overIndex);
        });
      } else {
        setTargetKeys((prev) => {
          const activeIndex = prev.findIndex((i) => i === active.id);
          const overIndex = prev.findIndex((i) => i === over?.id);
          return arrayMove(prev, activeIndex, overIndex);
        });
      }
    }
  };

  return (
    <Card
      type="inner"
      title="Projects"
      size="default"
      extra={
        <Flex gap="middle">
          <Button icon={<SyncOutlined />} loading={loading.fetch} onClick={handleFetch} />
          <Button icon={<SaveOutlined />} loading={loading.save} onClick={handleSave} />
        </Flex>
      }
    >
      {contextHolder}
      <Transfer
        titles={["Projects", "Selected"]}
        showSelectAll={false}
        styles={{ section: { width: "100%", height: "auto" } }}
        dataSource={projects}
        targetKeys={targetKeys}
        selectedKeys={selectedKeys}
        onChange={(nextTargetKeys) => {
          setTargetKeys(nextTargetKeys.map(String));
          setSelectedKeys([]);
        }}
        onSelectChange={(sourceSelected, targetSelected) => {
          setSelectedKeys([...sourceSelected, ...targetSelected].map(String));
        }}
      >
        {({ direction, filteredItems, selectedKeys: listSelectedKeys, onItemSelect }) => {
          return (
            <DndContext sensors={sensors} modifiers={[restrictToVerticalAxis]} onDragEnd={(e) => onDragEnd(direction, e)}>
              <SortableContext items={filteredItems.map((i) => i.repoName)} strategy={verticalListSortingStrategy}>
                <Table
                  dataSource={filteredItems}
                  pagination={false}
                  showHeader={false}
                  size="small"
                  rowKey="key"
                  components={{ body: { row: DragRow } }}
                  style={{ touchAction: "none" }}
                  rowSelection={{
                    selectedRowKeys: listSelectedKeys,
                    onSelect: ({ repoName }, selected) => onItemSelect(repoName, selected),
                  }}
                  onRow={({ repoName }) => ({
                    onClick: () => {
                      onItemSelect(repoName, !listSelectedKeys.includes(repoName));
                    },
                  })}
                  columns={[
                    {
                      dataIndex: "name",
                      render: (text, r) => (
                        <Input
                          defaultValue={text}
                          variant="borderless"
                          placeholder="Project name"
                          onClick={(e) => e.stopPropagation()}
                          onBlur={(e) => updateProjectField(r.repoName, "name", e.target.value)}
                        />
                      ),
                    },
                    {
                      dataIndex: "visible",
                      width: 50,
                      render: (val, r) => (
                        <Switch
                          size="small"
                          defaultChecked={val}
                          onClick={(_, e) => e.stopPropagation()}
                          onChange={(c) => updateProjectField(r.repoName, "visible", c)}
                        />
                      ),
                    },
                  ]}
                />
              </SortableContext>
            </DndContext>
          );
        }}
      </Transfer>
    </Card>
  );
}
