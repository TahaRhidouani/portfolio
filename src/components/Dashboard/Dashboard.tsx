"use client";

import { Data } from "@/types";
import { Button, Card, ConfigProvider, Flex, Layout, Space, theme } from "antd";
import { signOut } from "next-auth/react";
import { AboutMe } from "./AboutMe";
import { Achievements } from "./Achievements";
import { Main } from "./Main";
import { Projects } from "./Projects";
import { Work } from "./Work";

export function Dashboard({ data }: { data: Data }) {
  const token = data?.theme ? { colorPrimary: data.theme, colorLink: data.theme } : undefined;

  return (
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm, token }}>
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

          <Space orientation="vertical" size="middle" style={{ display: "flex", maxWidth: "800px", margin: "auto" }}>
            <Main data={data} />
            <AboutMe data={data} />
            <Work data={data} />
            <Projects data={data} />
            <Achievements data={data} />
          </Space>
        </Layout.Content>
      </Layout>
    </ConfigProvider>
  );
}
