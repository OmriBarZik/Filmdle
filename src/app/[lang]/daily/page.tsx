import type { Metadata } from "next";
import { DailyGameClient } from "@/components/LazyScreens";
import { Header } from "@/components/site/Header";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.meta.dailyTitle };
}

export default async function DailyPage() {
  const { t } = await getI18n();
  return (
    <>
      <Header title={t.daily.name} path="/daily" />
      <DailyGameClient />
    </>
  );
}
