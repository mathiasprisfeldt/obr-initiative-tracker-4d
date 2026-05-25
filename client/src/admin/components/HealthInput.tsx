import { TextField, TextFieldProps } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { simpleMathEval } from "../../utils/simple-math-eval";
import { orange, red, yellow } from "@mui/material/colors";
import { styled } from "@mui/material/styles";
import { getDamageLevel } from "../../utils/damage-level";

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
            <MaxHealthAwareMathField
                size="small"
                disabled={disabled}
                value={health}
                onValueChange={onHealthChange}
                sx={{ maxWidth: 60, mr: 1 }}
                maxhealth={maxHealth}
            />
            <MathField
                size="small"
                disabled={disabled}
                value={maxHealth}
                onValueChange={onMaxHealthChange}
                sx={{ maxWidth: 60, ml: 1 }}
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

const MaxHealthAwareMathField = styled(MathField)<{
    maxhealth: number;
}>`
    & .MuiOutlinedInput-root {
        & fieldset {
            ${(props) => {
                const level = getDamageLevel(props.value, props.maxhealth);
                if (level === "none") return;

                const colorMap = {
                    yellow: yellow[700],
                    orange: orange[700],
                    red: red[700],
                } as const;

                return `border-color: ${colorMap[level]};`;
            }}
        }
    }
`;
