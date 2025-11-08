import { TextField, TextFieldProps } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { simpleMathEval } from "../../utils/simple-math-eval";

export interface Props {
    disabled: boolean;
    health: number;
    maxHealth: number;
    onHealthChange?: (health: number) => void;
    onMaxHealthChange?: (maxHealth: number) => void;
}

export default function HealthInput({
    disabled,
    health,
    maxHealth,
    onHealthChange,
    onMaxHealthChange,
}: Props) {
    return (
        <>
            <MathField
                label="HP"
                size="small"
                disabled={disabled}
                value={health}
                onValueChange={onHealthChange}
                sx={{ maxWidth: 75, mr: 1 }}
            />
            <MathField
                label="Max HP"
                size="small"
                disabled={disabled}
                value={maxHealth}
                onValueChange={onMaxHealthChange}
                sx={{ maxWidth: 75, ml: 1 }}
            />
        </>
    );
}

function MathField({
    value,
    onValueChange,
    ...rest
}: {
    value: number;
    onValueChange?: (value: number) => void;
} & TextFieldProps) {
    const [draftValue, setDraftValue] = useState(value.toString());

    useEffect(() => {
        setDraftValue(value.toString());
    }, [value]);

    const submit = useCallback(() => {
        const evaluated = simpleMathEval(draftValue);
        if (evaluated === null) {
            setDraftValue(value.toString());
            return;
        }
        const clamped = Math.max(0, evaluated);
        if (clamped === value) {
            setDraftValue(value.toString());
            return;
        }
        onValueChange?.(Math.max(0, evaluated));
    }, [value, draftValue]);

    return (
        <TextField
            {...rest}
            value={draftValue}
            onChange={(e) => {
                return setDraftValue(e.target.value);
            }}
            onBlur={submit}
            onKeyUp={(e) => {
                if (e.key === "Enter") {
                    submit();
                }
            }}
        />
    );
}
