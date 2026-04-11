# dossier-typescript

A TypeScript library for lexing, parsing, and validating Dossier.

## Dossier Spec

### Core Syntax

- A dossier entry uses one of these shapes:
    - `identifier: value`
    - `identifier :: ... ;;`
    - `identifier: value :: ... ;;`
- A dossier without a value uses `identifier ::`.
- Anonymous dossiers appear at the root or inside arrays.
- Each parent dossier has a unique set of child identifiers.

Example:

```ds
person: "human" ::
	name: "John"
	wallet: "open" ::
		currency: "USD"
		value: 294.12
	;;
;;
```

### Values

- Supported scalar values: strings, integers, decimals, floats, booleans, and `null`.
- Arrays are written with `[` and `]`.
- Non-empty arrays require a trailing comma after every item.

Example:

```ds
tags: [
	"field",
	"sealed",
	"archive",
]
```

```ds
meta: [
	waypoint ::
		code: "A7"
	;;,
]
```

### Formatting

- Indentation uses tabs.
- Non-empty dossiers use expanded form.
- Empty dossiers may use inline form: `name :: ;;`.
- The first `::` or `[` stays on the same line as the identifier.
- Arrays use expanded form.
- Empty arrays may use inline form: `tags: []`.

Example:

```ds
expedition: "night-run" ::
	title: "Night archive"
	notes: null
	tags: []
	locker :: ;;
	checkpoints: [
		"north",
		"east",
	]
;;
```
