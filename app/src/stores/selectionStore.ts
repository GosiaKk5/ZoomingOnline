/**
 * User selection state store
 * Manages user selections for channel, TRC, and segment
 */
import { writable, derived, type Writable, type Readable } from "svelte/store";
import { isDataLoaded } from "./dataStore.ts";

// Selection state stores
export const selectedChannel: Writable<string> = writable("");
export const selectedTrc: Writable<string> = writable("");
export const selectedSegment: Writable<string> = writable("");

// Numeric derived selections to avoid parsing in components
function parseSelectedIndex(value: string): number | null {
  const match = value?.match(/(\d+)$/);
  return match && match[1] ? parseInt(match[1], 10) - 1 : null;
}

export const selectedChannelIndex: Readable<number | null> = derived(
  [selectedChannel],
  ([$selectedChannel]) => parseSelectedIndex($selectedChannel)
);

export const selectedTrcIndex: Readable<number | null> = derived(
  [selectedTrc],
  ([$selectedTrc]) => parseSelectedIndex($selectedTrc)
);

export const selectedSegmentIndex: Readable<number | null> = derived(
  [selectedSegment],
  ([$selectedSegment]) => parseSelectedIndex($selectedSegment)
);

// Derived selection states for better component integration
export const isDataReadyForPlot: Readable<boolean> = derived(
  [selectedChannel, selectedTrc, selectedSegment, isDataLoaded],
  ([$selectedChannel, $selectedTrc, $selectedSegment, $isDataLoaded]) =>
    Boolean(
      $isDataLoaded && 
      $selectedChannel && 
      $selectedTrc && 
      $selectedSegment
    )
);

export const selectionSummary: Readable<string> = derived(
  [selectedChannel, selectedTrc, selectedSegment],
  ([$selectedChannel, $selectedTrc, $selectedSegment]) =>
    `Channel: ${$selectedChannel || 'None'}, TRC: ${$selectedTrc || 'None'}, Segment: ${$selectedSegment || 'None'}`
);

export const hasValidSelections: Readable<boolean> = derived(
  [selectedChannel, selectedTrc, selectedSegment],
  ([$selectedChannel, $selectedTrc, $selectedSegment]) =>
    Boolean($selectedChannel && $selectedTrc && $selectedSegment)
);

export const selectionState: Readable<{
  channel: string;
  trc: string;
  segment: string;
  hasValidSelections: boolean;
  isReadyForPlot: boolean;
}> = derived(
  [selectedChannel, selectedTrc, selectedSegment, hasValidSelections, isDataReadyForPlot],
  ([$selectedChannel, $selectedTrc, $selectedSegment, $hasValidSelections, $isDataReadyForPlot]) => ({
    channel: $selectedChannel,
    trc: $selectedTrc,
    segment: $selectedSegment,
    hasValidSelections: $hasValidSelections,
    isReadyForPlot: $isDataReadyForPlot
  })
);

// Helper functions for selection management
export function resetSelections(): void {
  selectedChannel.set("");
  selectedTrc.set("");
  selectedSegment.set("");
}

export function setSelections(channel: string, trc: string, segment: string): void {
  selectedChannel.set(channel);
  selectedTrc.set(trc);
  selectedSegment.set(segment);
}

export function updateChannel(channel: string): void {
  selectedChannel.set(channel);
}

export function updateTrc(trc: string): void {
  selectedTrc.set(trc);
}

export function updateSegment(segment: string): void {
  selectedSegment.set(segment);
}

export function getSelectionValues(): Promise<{ channel: string; trc: string; segment: string }> {
  return new Promise((resolve) => {
    let channel = "";
    let trc = "";
    let segment = "";
    
    const unsubscribeChannel = selectedChannel.subscribe(val => channel = val);
    const unsubscribeTrc = selectedTrc.subscribe(val => trc = val);
    const unsubscribeSegment = selectedSegment.subscribe(val => segment = val);
    
    unsubscribeChannel();
    unsubscribeTrc();
    unsubscribeSegment();
    
    resolve({ channel, trc, segment });
  });
}