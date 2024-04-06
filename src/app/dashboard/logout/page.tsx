"use client";

import "dotenv/config";
import "@/app/globals.css";
import React from "react";
import {signOut} from "next-auth/react";
import {
    Alert, Button,
    ConfigProvider, Flex,
    Layout,
    theme,
} from "antd";

export default function App() {

    return (
        <ConfigProvider
            theme={{
                algorithm: theme.darkAlgorithm,
                token: {
                    colorPrimary: '#8075EAFF',
                    colorLink: '#8075EAFF',
                },
            }}
        >
            <Layout style={{minHeight: "100vh"}}>
                <Layout.Content
                    style={{padding: '48px', maxWidth: "800px", margin: "auto", display: "flex", alignItems: "center"}}>
                    <Flex gap="middle" vertical>
                        <Alert
                            message="Error"
                            description="This account is not authorized to access the dashboard."
                            type="error"
                            showIcon
                        />

                        <Button type="primary" onClick={() => signOut({redirect: true, callbackUrl: "/dashboard"})}>Try
                            again</Button>
                    </Flex>
                </Layout.Content>
            </Layout>
        </ConfigProvider>
    )
}

