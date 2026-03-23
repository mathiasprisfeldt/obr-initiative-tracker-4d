import { styled } from "@mui/material";
import { Character } from "../../store/tracker-store";
import CharacterAvatar from "./CharacterAvatar";
import { useRef } from "react";

const DEFAULT_VISIBLE = 5;

export interface Props {
    characters: Character[];
    currentCharacter?: Character;
    visibleCount?: number;
}

function circularDelta(from: number, to: number, n: number) {
    let d = to - from;
    while (d > n / 2) d -= n;
    while (d <= -n / 2) d += n;
    return d;
}

export default function CharacterRow({
    characters,
    currentCharacter,
    visibleCount = DEFAULT_VISIBLE,
    ...rest
}: Props) {
    const visible = Math.max(1, visibleCount);
    const half = Math.floor(visible / 2);
    const range = half + 1;
    const slot = 100 / visible;

    const n = characters.length;
    const curIdx = characters.findIndex((c) => c.id === currentCharacter?.id);

    // Monotonically incrementing step counter — never wraps.
    // When curIdx goes n-1 → 0 the step increments by +1, so every
    // item's React key shifts by exactly 1 each turn → smooth CSS transition.
    const trackRef = useRef<{ idx: number; step: number; n: number }>({
        idx: -1,
        step: 0,
        n: 0,
    });

    if (curIdx >= 0 && n > 0) {
        const t = trackRef.current;
        if (t.idx < 0 || t.n !== n) {
            t.idx = curIdx;
            t.step = 0;
            t.n = n;
        } else if (curIdx !== t.idx) {
            t.step += circularDelta(t.idx, curIdx, n);
            t.idx = curIdx;
        }
    }

    const step = trackRef.current.step;

    const items: { char: Character; offset: number; key: number }[] = [];
    if (n > 0 && curIdx >= 0) {
        for (let off = -range; off <= range; off++) {
            items.push({
                char: characters[(((curIdx + off) % n) + n) % n],
                offset: off,
                key: step + off,
            });
        }
    }

    return (
        <Viewport {...rest}>
            {items.map(({ char, offset, key }) => {
                const isCurrent = offset === 0;
                const slotPos = half - offset;
                const scale = isCurrent ? 1.15 : 0.85;
                return (
                    <Item
                        key={key}
                        style={{
                            height: `${slot}%`,
                            transform: `translateY(${slotPos * 100}%) scale(${scale})`,
                            zIndex: isCurrent ? 1 : 0,
                        }}
                    >
                        <AvatarSizer>
                            <StyledCharacterAvatar character={char} hasTurn={isCurrent} />
                        </AvatarSizer>
                    </Item>
                );
            })}
        </Viewport>
    );
}

const StyledCharacterAvatar = styled(CharacterAvatar)`
    rotate: -90deg;
    height: 100%;
`;

const AvatarSizer = styled("div")`
    height: 100%;
    aspect-ratio: 1 / 1;
`;

const Item = styled("div")`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: transform 500ms cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform;
`;

const Viewport = styled("div")`
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
`;
