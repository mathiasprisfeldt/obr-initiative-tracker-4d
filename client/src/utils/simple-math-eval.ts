export function simpleMathEval(input: string): number | null {
    if (input.trim() === "") {
        return 0;
    }

    if (input.match(/^[0-9+\-*/().\s]+$/) === null) {
        return null;
    }

    try {
        const result = Number(eval(input));

        if (isNaN(result)) {
            return null;
        }

        return result;
    } catch (error) {
        return null;
    }
}
