import { TextField, TextFieldProps } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { simpleMathEval } from "../../utils/simple-math-eval";
import { orange, red, yellow } from "@mui/material/colors";
import { styled } from "@mui/material/styles";

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
            ${(props) => {
                if (props.maxhealth <= 0) {
                    return;
                }

                const percentage = (props.value / props.maxhealth) * 100;
                if (percentage >= 50) {
                    return;
                }

                let color: string = red[700];
                if (percentage >= 25) {
                    color = yellow[700];
                }
                if (percentage >= 15) {
                    color = orange[700];
                }

                return `border-color: ${color};`;
            }}
        }
    }
`;
