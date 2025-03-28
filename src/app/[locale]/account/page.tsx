import { Container } from "@/components/Containers";
import { HeaderPadding } from "@/components/Header";
import { useFormatter, useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/navigation";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SignOutButton } from "@/app/[locale]/account/Components";
import { Progress } from "@/components/ui/progress";
import React from "react";
import { getServerSession } from "@/lib/latentcat-auth/server";
import {
  PaymentMethod,
  QrbtfUser,
  UserTier,
} from "@/lib/latentcat-auth/common";
import { Button } from "@/components/ui/button";
import {
  NEXT_PUBLIC_ACCOUNT_URL,
  NEXT_PUBLIC_QRBTF_API_ENDPOINT,
} from "@/lib/env/client";
import { cookies } from "next/headers";

function PageTitle() {
  const t = useTranslations("account");
  return (
    <div>
      <Container>
        <div className="py-16 flex flex-col items-center">
          <h1 className="text-4xl font-bold text-center">{t("title")}</h1>
        </div>
      </Container>
    </div>
  );
}

interface SectionProps {
  title: string;
  children?: React.ReactNode;
}

function Section(props: SectionProps) {
  return (
    <div>
      <div className="mb-3">
        <h2 className="text-base font-bold _text-foreground/50">
          {props.title}
        </h2>
      </div>

      <Card className="w-full flex flex-col divide-y">{props.children}</Card>
    </div>
  );
}

interface SectionUserProps {
  user: QrbtfUser;
  generationCount: number;
  downloadCount: number;
  freeUsage: number;
  maxFreeUsage: number;
}

function SectionUser(props: SectionUserProps) {
  const t = useTranslations("account");
  const formatter = useFormatter();
  const tUserButton = useTranslations("user_button");

  const paymentText = (() => {
    if (props.user.tier !== UserTier.Pro) {
      return "";
    }
    switch (props.user.payment) {
      case PaymentMethod.None:
        return "";
      case PaymentMethod.Kofi:
        return "Ko-fi";
      case PaymentMethod.Stripe:
        return "Stripe";
      case PaymentMethod.IAP:
        return "IAP";
      case PaymentMethod.Member:
        return "Member";
    }
  })();

  return (
    <div>
      <Container>
        <div className="w-full flex flex-col gap-6">
          <Section title={t("profile")}>
            <div className="w-full flex items-center p-3">
              <div className="grow flex items-center gap-3">
                <Avatar className="w-9 h-9 group-hover:opacity-80 transition-opacity">
                  <AvatarImage src={props.user.image} />
                  <AvatarFallback>{props.user.name}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-0">
                  <div className="font-semibold">{props.user.name}</div>
                  {/* <div className="text-xs opacity-50">{props.user.email}</div> */}
                </div>
              </div>

              <div className="space-x-4">
                <a href={NEXT_PUBLIC_ACCOUNT_URL}>
                  <Button variant="outline" size="sm">
                    {t("manage")}
                  </Button>
                </a>
                <SignOutButton text={tUserButton("sign_out")} />
              </div>
            </div>
          </Section>

          <Section title={t("plan")}>
            <div className="flex flex-col gap-2 p-3">
              <div className="w-full flex items-center text-sm">
                <div className="grow flex items-center gap-3">
                  {t("current_plan")}
                </div>
                <div className="text-foreground/70">
                  {props.user.tier === UserTier.Trial ||
                  !props.user.subscribe_expire
                    ? ""
                    : formatter.dateTime(props.user.subscribe_expire, {
                        dateStyle: "short",
                      })}
                </div>
              </div>
              <div className="text-2xl font-bold">
                {UserTier[props.user.tier || 0]}
              </div>
            </div>
            {props.user.tier !== UserTier.Trial && (
              <div className="flex flex-col gap-2 p-3">
                <div className="w-full flex items-center text-sm">
                  <div className="grow flex items-center gap-3">
                    {t("payment_method")}
                  </div>
                  <div className="text-foreground/70">{paymentText}</div>
                  {(() => {
                    if (props.user.tier !== UserTier.Pro) {
                      return null;
                    }

                    switch (props.user.payment) {
                      case PaymentMethod.Kofi:
                        return (
                          <Link href="https://ko-fi.com/latentcat">
                            <Button
                              className="ml-4"
                              variant="secondary"
                              size="sm"
                            >
                              {t("manage_subscription")}
                            </Button>
                          </Link>
                        );
                      case PaymentMethod.Stripe:
                        return (
                          <Link
                            target="_blank"
                            href={`${NEXT_PUBLIC_QRBTF_API_ENDPOINT}/stripe/create-customer-portal-session?id=${props.user.id}`}
                          >
                            <Button
                              className="ml-4"
                              variant="secondary"
                              size="sm"
                            >
                              {t("manage_subscription")}
                            </Button>
                          </Link>
                        );
                      default:
                        return null;
                    }
                  })()}
                </div>
              </div>
            )}
            <div className="flex flex-col gap-2 p-3">
              <div className="w-full flex items-center text-sm">
                <div className="grow flex items-center gap-3">{t("usage")}</div>
                <div className="text-foreground/70">
                  {props.user.tier === UserTier.Trial
                    ? `${props.freeUsage} / ${props.maxFreeUsage}`
                    : t("unlimited")}
                </div>
              </div>
              <Progress
                value={
                  props.user.tier === UserTier.Trial
                    ? (100 * props.freeUsage) / props.maxFreeUsage
                    : 0
                }
                className="h-1.5"
              />
            </div>
            <div className="flex flex-col gap-2 p-3">
              <div className="w-full flex items-center text-sm">
                <div className="grow flex items-center gap-3">
                  {t("support")}
                </div>
                <div className="text-foreground/70">contact@latentcat.com</div>
              </div>
            </div>
          </Section>

          <Section title={t("statistics")}>
            <div className="w-full flex items-center justify-between text-sm p-3">
              <div>{t("generation_count")}</div>
              <div className="text-foreground/70">{props.generationCount}</div>
            </div>

            <div className="w-full flex items-center justify-between text-sm p-3">
              <div>{t("download_count")}</div>
              <div className="text-foreground/70">{props.downloadCount}</div>
            </div>
          </Section>
        </div>
      </Container>
    </div>
  );
}

export default async function Page() {
  const session = await getServerSession();
  if (!session) {
    redirect("/");
    return;
  }

  const cookie = cookies();
  const resp = await fetch(
    `${NEXT_PUBLIC_QRBTF_API_ENDPOINT}/user_stat/get_user_stat`,
    {
      headers: {
        Cookie: `lc_token=${cookie.get("lc_token")?.value || ""}`,
      },
    },
  );
  const userQrcodeStatData = await resp.json();

  return (
    <div>
      <HeaderPadding />
      <PageTitle />
      <div className="flex flex-col items-center">
        <div className="w-full max-w-2xl">
          <SectionUser
            user={session}
            downloadCount={userQrcodeStatData?.download_count ?? 0}
            generationCount={userQrcodeStatData?.generation_count ?? 0}
            freeUsage={userQrcodeStatData?.usage_count ?? 0}
            maxFreeUsage={10}
          />
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({
  params: { locale },
}: Readonly<{
  params: { locale: string };
}>) {
  const t = await getTranslations({ locale, namespace: "account" });

  return {
    title: t("title"),
    description: t("desc"),
  };
}
