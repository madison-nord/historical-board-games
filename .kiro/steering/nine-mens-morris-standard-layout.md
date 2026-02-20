# Nine Men's Morris - Standard Board Layout

## CRITICAL: Always Use Standard Layout

**NEVER try to "match what's already implemented" if it's wrong. Always fix it to match the standard rules.**

## Standard Nine Men's Morris Board

The standard Nine Men's Morris board has:
- **24 positions total**
- **3 concentric squares**
- **8 positions per square** (4 corners + 4 midpoints on each side)
- **16 possible mills** (lines of 3)

## Position Numbering (Clockwise from Top-Left)

### Outer Square (Positions 0-7)
```
0---1---2
|       |
7       3
|       |
6---5---4
```
- Corners: 0, 2, 4, 6
- Midpoints: 1, 3, 5, 7

### Middle Square (Positions 8-15)
```
8---9--10
|       |
15      11
|       |
14--13--12
```
- Corners: 8, 10, 12, 14
- Midpoints: 9, 11, 13, 15

### Inner Square (Positions 16-23)
```
16--17--18
|       |
23      19
|       |
22--21--20
```
- Corners: 16, 18, 20, 22
- Midpoints: 17, 19, 21, 23

## Complete Board Visualization
```
0---------1---------2
|         |         |
|    8----9----10   |
|    |    |    |    |
|    |  16-17-18    |
|    |   |    |     |
7---15--23    19---3
|    |        |     |
|    |  22-21-20    |
|    |    |    |    |
|   14---13---12    |
|         |         |
6---------5---------4
```

## Mill Patterns (16 Total)

### Horizontal Mills (6)
- Outer: {0,1,2}, {6,5,4}
- Middle: {8,9,10}, {14,13,12}
- Inner: {16,17,18}, {22,21,20}

### Vertical Mills - Edges (6)
- Left edges: {0,7,6}, {8,15,14}, {16,23,22}
- Right edges: {2,3,4}, {10,11,12}, {18,19,20}

### Radial Mills - Connecting Squares (4)
- Top: {1,9,17}
- Right: {3,11,19}
- Bottom: {5,13,21}
- Left: {7,15,23}

## Adjacency Rules

Each position connects to:
1. **Adjacent positions on the same square** (along the square's edges)
2. **Corresponding position on adjacent square** (for midpoints only, via radial lines)

### Examples:
- Position 0 (outer top-left corner): connects to 1 (right) and 7 (down)
- Position 1 (outer top midpoint): connects to 0 (left), 2 (right), and 9 (inward to middle square)
- Position 9 (middle top midpoint): connects to 8 (left), 10 (right), 1 (outward), and 17 (inward)

## Implementation Requirements

### Backend (Java)
- `Board.java` MUST use this exact position numbering
- Adjacency map MUST match the standard layout
- Mill patterns MUST be the 16 standard mills

### Frontend (TypeScript)
- `BoardRenderer.ts` MUST map visual coordinates to match backend positions
- `GameController.ts` adjacency map MUST match `Board.java`
- Mill checking MUST use the same patterns

## Common Mistakes to Avoid

1. **DO NOT use 9+9+6 layout** - This is NOT standard Nine Men's Morris
2. **DO NOT try to "match existing wrong implementation"** - Fix it properly
3. **DO NOT assume position 4 is in the center** - It's bottom-right corner of outer square
4. **DO NOT forget radial connections** - Midpoints connect across squares

## Verification Checklist

Before considering the board implementation correct:
- [ ] 24 positions total (8 per square)
- [ ] 16 mill patterns defined
- [ ] All adjacencies are bidirectional
- [ ] Midpoints connect across squares via radial lines
- [ ] Corners only connect along square edges
- [ ] Backend and frontend use identical position numbering
- [ ] All tests pass with the standard layout

## References

Standard Nine Men's Morris rules state:
- 3 concentric squares
- Lines connecting midpoints of squares
- 24 intersection points (8 per square)
- 16 possible mills

This is the universally accepted layout for Nine Men's Morris and MUST be followed.
