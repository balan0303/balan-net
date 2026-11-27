"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Music } from "../components/AudioManager";

export default function Projeler() {
  const [name, setName] = useState("");

  useEffect(() => {
    setName(sessionStorage.getItem("ziyaretci") ?? "");
  }, []);

  return (
    <main className="site-placeholder">
      <Music track="site" />
      <h1>Odaya hoş geldin{name ? `, ${name}` : ""}!</h1>
      <p>Burası yakında projelerimle, yazılarımla ve matematiksel çalışmalarımla dolacak.</p>
      <Link className="pixel-btn" href="/">Başa dön</Link>
    </main>
  );
}