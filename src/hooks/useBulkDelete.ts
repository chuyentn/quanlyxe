import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseBulkDeleteOptions {
    table: string;
    onSuccess?: () => void;
    onError?: (error: any) => void;
}

export function useBulkDelete({ table, onSuccess, onError }: UseBulkDeleteOptions) {
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);

    const deleteIds = async (ids: string[]) => {
        setIsDeleting(true);

        let successCount = 0;
        let failedCount = 0;
        const failedIds: string[] = [];

        try {
            // Delete each row individually to handle partial success
            for (const id of ids) {
                try {
                    const { error } = await supabase
                        .from(table)
                        .delete()
                        .eq('id', id);

                    if (error) throw error;
                    successCount++;
                } catch (error: any) {
                    failedCount++;
                    failedIds.push(id);
                    console.error(`Failed to delete ${id}:`, error);
                }
            }

            // Show appropriate message based on results
            if (successCount > 0 && failedCount === 0) {
                // All deletions succeeded
                toast({
                    title: "Xóa thành công",
                    description: `Đã xóa ${successCount} bản ghi khỏi hệ thống.`,
                    variant: "default",
                });
                onSuccess?.();
            } else if (successCount > 0 && failedCount > 0) {
                // Partial success
                toast({
                    title: "Xóa một phần thành công",
                    description: `Đã xóa ${successCount} bản ghi. ${failedCount} bản ghi không thể xóa do đang được sử dụng ở nơi khác (ví dụ: trong chuyến đi, chi phí).`,
                    variant: "default",
                });
                onSuccess?.(); // Still call onSuccess to refresh the table
            } else {
                // All deletions failed
                toast({
                    title: "Không thể xóa bản ghi",
                    description: `Tất cả ${failedCount} bản ghi đang được sử dụng ở nơi khác (ví dụ: trong chuyến đi, chi phí). Vui lòng kiểm tra lại hoặc sử dụng xóa mềm (ẩn dòng).`,
                    variant: "destructive",
                });
                onError?.(new Error("All deletions failed"));
            }
        } catch (error: any) {
            console.error("Bulk delete error:", error);
            toast({
                title: "Xóa thất bại",
                description: error.message || "Có lỗi xảy ra khi xóa dữ liệu.",
                variant: "destructive",
            });
            onError?.(error);
        } finally {
            setIsDeleting(false);
        }
    };

    return {
        deleteIds,
        isDeleting
    };
}
