import "./tracker.css";
import {
  Character,
  TrackerState,
  useTrackerState,
} from "../store/tracker-store";
import CharacterRow from "./components/CharacterRow";
import OBR from "@owlbear-rodeo/sdk";
import { styled, Typography } from "@mui/material";

export function Tracker() {
  const state = useTrackerState();

  if (!OBR.isAvailable) return <Preview endEncounter={false} />;

  return <Content state={state} />;
}

function Content({ state }: { state: TrackerState | undefined }) {
  if (!state?.hasEncounterStarted) return;

  return (
    <Container>
      {state && (
        <StyledCharacterRow
          characters={state.characters}
          currentCharacter={state.currentCharacter}
        />
      )}
      <RoundText typography="body2">Round {state?.round}</RoundText>
    </Container>
  );
}

const Container = styled("div")`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

const StyledCharacterRow = styled(CharacterRow)`
  flex-grow: 1;
`;

const RoundText = styled(Typography)`
  font-weight: bold;
  margin: 0;
  padding: 8px;
  writing-mode: sideways-lr;
  color: white;
  border-radius: 16px;
  border: 2px solid white;
  background: gray;
`;

export const PopoverId = "obr-initiative-tracker-4d-tracker-popover";

export function OpenTracker() {
  OBR.popover.open({
    id: PopoverId,
    url: `${import.meta.env.BASE_URL}/src/tracker/index.html`,
    width: 200,
    height: 999999,
    anchorOrigin: { horizontal: "LEFT", vertical: "CENTER" },
    transformOrigin: { horizontal: "LEFT", vertical: "CENTER" },
    disableClickAway: true,
    hidePaper: true,
    marginThreshold: 0,
  });
}

function Preview({ endEncounter }: { endEncounter: boolean }) {
  const characters: Character[] = [
    {
      id: "1",
      properties: {
        name: "Daggert Skyggestikker",
        health: 0,
        maxHealth: 0,
        portraitImage: {
          displayName: "Daggert Skyggestikker",
          url: "https://dnd.mathiasprisfeldt.me/img/Peter.png",
        },
        hideName: true,
      },
    },
    {
      id: "2",
      properties: {
        name: "Alaeya",
        health: 0,
        maxHealth: 0,
        portraitImage: {
          displayName: "Alaeya",
          url: "https://dnd.mathiasprisfeldt.me/img/Vanessa.png",
        },
        hideName: true,
      },
    },
    {
      id: "3",
      properties: {
        name: "Nadarr",
        health: 0,
        maxHealth: 0,
        portraitImage: {
          displayName: "Nadarr",
          url: "https://dnd.mathiasprisfeldt.me/img/Nicholai.png",
        },
        hideName: true,
      },
    },
    {
      id: "4",
      properties: {
        name: "Wolf",
        health: 0,
        maxHealth: 0,
        portraitImage: {
          displayName: "Wolf",
          url: "https://dnd.mathiasprisfeldt.me/img/Wolf.png",
        },
        hideName: false,
      },
    },
  ];

  const state: TrackerState = {
    characters: characters,
    currentCharacter: characters[0],
    round: 1,
    hasEncounterStarted: !endEncounter,
  };

  return (
    <div style={{ width: "200px", height: "100%", background: "gray" }}>
      <Content state={state} />
    </div>
  );
}
