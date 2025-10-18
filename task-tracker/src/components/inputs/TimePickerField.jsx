"use client";

import { forwardRef, useMemo } from "react";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";

const TimePickerField = forwardRef(function TimePickerField(
  { value, onChange, disabled = false, placeholder = "時刻を選択", minutesStep = 5, className = "", inputId },
  ref
) {
  const parsed = useMemo(() => {
    if (!value) return null;
    const dt = dayjs(value, "HH:mm");
    return dt.isValid() ? dt : null;
  }, [value]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <TimePicker
        ref={ref}
        ampm={false}
        value={parsed}
        onChange={(newValue) => {
          if (!onChange) return;
          if (!newValue || !newValue.isValid()) {
            onChange("");
            return;
          }
          onChange(newValue.format("HH:mm"));
        }}
        disabled={disabled}
        minutesStep={minutesStep}
        slotProps={{
          textField: {
            fullWidth: true,
            placeholder,
            size: "small",
            className,
            id: inputId,
            inputProps: { "aria-label": placeholder, id: inputId },
            sx: {
              "& .MuiOutlinedInput-root": {
                height: 40,
                borderRadius: "0.75rem",
                fontSize: "0.95rem",
                backgroundColor: "hsl(var(--background))",
                color: "hsl(var(--foreground))",
                "& fieldset": {
                  borderColor: "hsl(var(--border))",
                },
                "&:hover fieldset": {
                  borderColor: "hsl(var(--foreground) / 0.6)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "hsl(var(--ring))",
                  boxShadow: "0 0 0 1px hsl(var(--ring) / 0.6)",
                },
                "&.Mui-disabled fieldset": {
                  borderColor: "hsl(var(--border) / 0.5)",
                },
              },
              "& .MuiOutlinedInput-input": {
                padding: "8px 12px",
              },
              "& .MuiFormHelperText-root": {
                display: "none",
              },
            },
          },
          openPickerButton: {
            sx: {
              color: "hsl(var(--muted-foreground))",
              "&:hover": {
                backgroundColor: "hsl(var(--muted) / 0.3)",
              },
            },
          },
        }}
      />
    </LocalizationProvider>
  );
});

export default TimePickerField;
