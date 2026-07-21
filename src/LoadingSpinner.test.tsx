import React from 'react';
import renderer, { act } from 'react-test-renderer';
import {
  ActivityIndicator,
  Provider as PaperProvider,
} from 'react-native-paper';
import LoadingSpinner from './LoadingSpinner';

function pointerEventsFor(loading: boolean): unknown {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(
      <PaperProvider>
        <LoadingSpinner loading={loading} />
      </PaperProvider>
    );
  });
  return tree.root.findByType(ActivityIndicator).props.pointerEvents;
}

describe('LoadingSpinner', () => {
  it('does not intercept touches when idle (so it never blocks the header)', () => {
    expect(pointerEventsFor(false)).toBe('none');
  });

  it('intercepts touches while loading', () => {
    expect(pointerEventsFor(true)).toBe('auto');
  });
});
