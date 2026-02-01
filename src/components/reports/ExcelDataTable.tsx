import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export interface ColumnDef<T> {
  id: string;
  label: string;
  width?: string;
  align?: "left" | "center" | "right";
  render: (row: T) => ReactNode;
  footer?: (data: T[]) => ReactNode;
  visible?: boolean;
  pinned?: boolean;
}

interface ExcelDataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onRowClick?: (row: T) => void;
  className?: string;
}

export function ExcelDataTable<T>({
  data,
  columns,
  onRowClick,
  className,
}: ExcelDataTableProps<T>) {
  const visibleColumns = columns.filter((col) => col.visible !== false);

  return (
    <div className={cn("rounded-md border overflow-hidden flex flex-col h-full", className)}>
      <div className="flex-1 overflow-auto relative">
        <Table>
          <TableHeader className="sticky top-0 bg-secondary/50 z-10 shadow-sm backdrop-blur-sm">
            <TableRow>
              {visibleColumns.map((col) => (
                <TableHead
                  key={col.id}
                  className={cn(
                    "whitespace-nowrap font-bold h-10 px-3",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                    col.pinned && "sticky left-0 bg-background z-20 border-r shadow-[1px_0_0_0_rgba(0,0,0,0.1)]"
                  )}
                  style={{ width: col.width }}
                >
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, i) => (
                <TableRow
                  key={i}
                  className={cn("hover:bg-muted/50 transition-colors", onRowClick && "cursor-pointer")}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {visibleColumns.map((col) => (
                    <TableCell
                      key={col.id}
                      className={cn(
                        "py-2 px-3 whitespace-nowrap",
                        col.align === "right" && "text-right",
                        col.align === "center" && "text-center",
                        col.pinned && "sticky left-0 bg-background z-10 border-r shadow-[1px_0_0_0_rgba(0,0,0,0.1)] group-hover:bg-muted/50"
                      )}
                    >
                      {col.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
          {data.length > 0 && visibleColumns.some(c => c.footer) && (
            <TableFooter className="sticky bottom-0 bg-secondary/80 font-bold z-10 shadow-inner backdrop-blur-sm">
              <TableRow>
                {visibleColumns.map((col) => (
                  <TableCell
                    key={col.id}
                    className={cn(
                      "py-2 px-3 whitespace-nowrap",
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center",
                      col.pinned && "sticky left-0 bg-secondary/80 z-20 border-r"
                    )}
                  >
                    {col.footer ? col.footer(data) : null}
                  </TableCell>
                ))}
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
}
