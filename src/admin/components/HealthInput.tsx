import { TextField, TextFieldProps } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { simpleMathEval } from "../../utils/simple-math-eval";
import styled from "@emotion/styled";
import { orange, red, yellow } from "@mui/material/colors";

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
                label="HP"
                size="small"
                disabled={disabled}
                value={health}
                onValueChange={onHealthChange}
                sx={{ maxWidth: 75, mr: 1 }}
                maxhealth={maxHealth}
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

const MaxHealthAwareMathField = styled(MathField)<{
    maxhealth: number;
}>`
    & .MuiOutlinedInput-root {
        & fieldset {
            border-color: ${(props) => {
                if (props.maxhealth <= 0) {
                    return "inherit";
                }

                const percentage = (props.value / props.maxhealth) * 100;
                if (percentage >= 50) {
                    return "inherit";
                }
                if (percentage >= 25) {
                    return yellow[700];
                }
                if (percentage >= 15) {
                    return orange[700];
                }

                return red[700];
            }};
        }
    }
`;
