import { toast as sonner } from "sonner";

const DURATION = 3000;

/** Toast tiện ích với màu theo loại, thời lượng 3 giây. */
export const toast = {
  success(message: string, description?: string) {
    sonner.success(message, { description, duration: DURATION });
  },
  warning(message: string, description?: string) {
    sonner.warning(message, { description, duration: DURATION });
  },
  error(message: string, description?: string) {
    sonner.error(message, { description, duration: DURATION });
  },
  info(message: string, description?: string) {
    sonner.message(message, { description, duration: DURATION });
  },
};
