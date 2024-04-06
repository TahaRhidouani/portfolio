"use client";

import Link from 'next/link'
import Image from 'next/image'
import styles from "./not-found.module.css"

export default function NotFound() {
    return (
        <div className={styles.wrapper}>

            <div className={styles.imageWrapper}>
                <Image className={styles.head} src="/assets/head.png" alt="Head" height={500} width={500}
                       draggable="false"/>
                <Image className={styles.xl} src="/assets/x.gif" alt="x" height={400} width={400} draggable="false"/>
                <Image className={styles.xr} src="/assets/x.gif" alt="x" height={400} width={400} draggable="false"/>
            </div>

            <h1 className={styles.title}>Not Found</h1>
            <Link href="/" className={styles.link}>Return Home</Link>
        </div>
    )
}