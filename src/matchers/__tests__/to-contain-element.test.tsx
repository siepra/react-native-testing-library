import * as React from 'react';
import { View } from 'react-native';
import { render, screen } from '../..';
import '../extend-expect';

test('toContainElement() on parent view', () => {
  render(
    <View testID="parent">
      <View testID="child" />
    </View>
  );

  const parent = screen.getByTestId('parent');
  const child = screen.getByTestId('child');

  expect(parent).toContainElement(child);

  expect(() => expect(parent).not.toContainElement(child))
    .toThrowErrorMatchingInlineSnapshot(`
    "expect(element).not.toContainElement(element)

      <View
        testID="parent"
      /> 

    contains:

       <View
        testID="child"
      />
            "
  `);
});

test('toContainElement() on non-React elements', () => {
  render(<View testID="view" />);

  const view = screen.getByTestId('view');

  expect(() => expect({ name: 'Non-React element' }).not.toContainElement(view))
    .toThrowErrorMatchingInlineSnapshot(`
    "expect(received).not.toContainElement()

    received value must be a host element.
    Received has type:  object
    Received has value: {"name": "Non-React element"}"
  `);

  expect(() => expect(true).not.toContainElement(view))
    .toThrowErrorMatchingInlineSnapshot(`
      "expect(received).not.toContainElement()

      received value must be a host element.
      Received has type:  boolean
      Received has value: true"
    `);
});
