import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface DrillDownTripTableProps {
    trips: any[];
    isLoading: boolean;
}

export function DrillDownTripTable({ trips, isLoading }: DrillDownTripTableProps) {
    if (isLoading) {
        return <div className="text-center py-4">Đang tải dữ liệu chuyến...</div>;
    }

    if (!trips || trips.length === 0) {
        return <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">Không tìm thấy chuyến nào trong kỳ báo cáo này.</div>;
    }

    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Mã chuyến</TableHead>
                        <TableHead>Ngày đi</TableHead>
                        <TableHead>Lộ trình</TableHead>
                        <TableHead className="text-right">Doanh thu</TableHead>
                        <TableHead className="text-right">Chi phí</TableHead>
                        <TableHead className="text-right">Lợi nhuận</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {trips.map((trip) => (
                        <TableRow key={trip.id}>
                            <TableCell className="font-medium">{trip.trip_code}</TableCell>
                            <TableCell>
                                {trip.departure_date ? format(new Date(trip.departure_date), 'dd/MM/yyyy') : 'N/A'}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate" title={trip.route?.route_name || 'N/A'}>
                                {trip.route?.route_name || '---'}
                            </TableCell>
                            <TableCell className="text-right text-green-600 font-medium">
                                {formatCurrency(trip.total_revenue || 0)}
                            </TableCell>
                            <TableCell className="text-right text-red-600">
                                {formatCurrency(trip.total_expense || 0)}
                            </TableCell>
                            <TableCell className="text-right font-bold text-blue-700">
                                {formatCurrency(trip.profit || 0)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
