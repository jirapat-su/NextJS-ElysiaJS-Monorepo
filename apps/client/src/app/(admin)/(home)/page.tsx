import { Button } from '@repo/shadcn/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shadcn/components/ui/card';
import {
  Activity,
  CreditCard,
  DollarSign,
  Download,
  Users,
} from 'lucide-react';

export default async function HomePage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-bold text-3xl tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">$45,231.89</div>
            <p className="text-muted-foreground text-xs">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">+2350</div>
            <p className="text-muted-foreground text-xs">
              +180.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Sales</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">+12,234</div>
            <p className="text-muted-foreground text-xs">
              +19% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Active Now</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">+573</div>
            <p className="text-muted-foreground text-xs">
              +201 since last hour
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="flex h-[350px] items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground">
              Chart Placeholder
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>You made 265 sales this month.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="flex items-center">
                <div className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full">
                  <div className="flex h-full w-full items-center justify-center bg-muted text-xs">
                    OM
                  </div>
                </div>
                <div className="ml-4 space-y-1">
                  <p className="font-medium text-sm leading-none">
                    Olivia Martin
                  </p>
                  <p className="text-muted-foreground text-sm">
                    olivia.martin@email.com
                  </p>
                </div>
                <div className="ml-auto font-medium">+$1,999.00</div>
              </div>
              <div className="flex items-center">
                <div className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full">
                  <div className="flex h-full w-full items-center justify-center bg-muted text-xs">
                    JL
                  </div>
                </div>
                <div className="ml-4 space-y-1">
                  <p className="font-medium text-sm leading-none">
                    Jackson Lee
                  </p>
                  <p className="text-muted-foreground text-sm">
                    jackson.lee@email.com
                  </p>
                </div>
                <div className="ml-auto font-medium">+$39.00</div>
              </div>
              <div className="flex items-center">
                <div className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full">
                  <div className="flex h-full w-full items-center justify-center bg-muted text-xs">
                    IN
                  </div>
                </div>
                <div className="ml-4 space-y-1">
                  <p className="font-medium text-sm leading-none">
                    Isabella Nguyen
                  </p>
                  <p className="text-muted-foreground text-sm">
                    isabella.nguyen@email.com
                  </p>
                </div>
                <div className="ml-auto font-medium">+$299.00</div>
              </div>
              <div className="flex items-center">
                <div className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full">
                  <div className="flex h-full w-full items-center justify-center bg-muted text-xs">
                    WK
                  </div>
                </div>
                <div className="ml-4 space-y-1">
                  <p className="font-medium text-sm leading-none">
                    William Kim
                  </p>
                  <p className="text-muted-foreground text-sm">
                    will@email.com
                  </p>
                </div>
                <div className="ml-auto font-medium">+$99.00</div>
              </div>
              <div className="flex items-center">
                <div className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full">
                  <div className="flex h-full w-full items-center justify-center bg-muted text-xs">
                    SD
                  </div>
                </div>
                <div className="ml-4 space-y-1">
                  <p className="font-medium text-sm leading-none">
                    Sofia Davis
                  </p>
                  <p className="text-muted-foreground text-sm">
                    sofia.davis@email.com
                  </p>
                </div>
                <div className="ml-auto font-medium">+$39.00</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
