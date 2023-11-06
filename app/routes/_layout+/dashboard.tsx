import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link } from "@remix-run/react";
import AssetsAreaChart from "~/components/dashboard/assets-area-chart";
import CustodiansList from "~/components/dashboard/custodians";
import NewestAssets from "~/components/dashboard/newest-assets";
import NewsBar from "~/components/dashboard/news-bar";
import { ErrorBoundryComponent } from "~/components/errors";
import { db } from "~/database";
import { getAssets } from "~/modules/asset";

import { requireAuthSession } from "~/modules/auth";
import { getAssetsCreatedInEachMonth } from "~/utils/get-assets-created-in-each-month";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAuthSession(request);
  const { userId } = await requireAuthSession(request);
  const page = 1;
  const perPage = 5;
  const newAssets = await getAssets({ userId, page, perPage });

  const custodians = await db.custody.groupBy({
    by: ["teamMemberId"],
    _count: {
      teamMemberId: true,
    },
    orderBy: {
      _count: {
        teamMemberId: "desc",
      },
    },
  });

  const assetsCreatedInEachMonth = getAssetsCreatedInEachMonth();

  return json({
    newAssets,
    custodians,
    assetsCreatedInEachMonth,
  });
}

export const handle = {
  breadcrumb: () => <Link to="/dashboard">Dashboard</Link>,
};

export default function DashboardPage() {
  return (
    <div>
      <NewsBar
        heading="We’ve just announced our Series A!"
        description="Read about it from our CEO."
        url="."
      />
      <div className="w-full">
        <AssetsAreaChart />
      </div>
      <div className="flex gap-4">
        <div className="lg:w-1/2">
          <NewestAssets />
        </div>
        <div className="lg:w-1/2">
          <CustodiansList />
        </div>
      </div>
    </div>
  );
}

export const ErrorBoundary = () => <ErrorBoundryComponent />;
