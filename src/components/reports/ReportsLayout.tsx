import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportByVehicleTable } from "./ReportByVehicleTable";
import { ReportByDriverTable } from "./ReportByDriverTable";
import { ReportByFleetTable } from "./ReportByFleetTable";

export function ReportsLayout() {
  const [activeTab, setActiveTab] = useState("vehicle");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Báo Cáo Tổng Hợp</h2>
          <p className="text-muted-foreground">
            Phân tích hiệu suất, doanh thu, và chi phí vận tải.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="vehicle">Theo Xe</TabsTrigger>
          <TabsTrigger value="driver">Theo Tài xế</TabsTrigger>
          <TabsTrigger value="fleet">Theo Đội xe</TabsTrigger>
        </TabsList>

        <TabsContent value="vehicle" className="space-y-4">
          <ReportByVehicleTable />
        </TabsContent>

        <TabsContent value="driver" className="space-y-4">
          <ReportByDriverTable />
        </TabsContent>

        <TabsContent value="fleet" className="space-y-4">
          <ReportByFleetTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
