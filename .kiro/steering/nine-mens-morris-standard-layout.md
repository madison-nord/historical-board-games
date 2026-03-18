---
title: Nine Men's Morris Standard Board Layout
inclusion: fileMatch
fileMatchPattern: '*Board*,*board*,*Game*,*game*,*Engine*,*engine*,*Rule*,*rule*,*Mill*,*mill*'
---

# Nine Men's Morris — Standard Board Layout

24 positions, 3 concentric squares (8 each), 16 mills.

## Position Numbering
```
Outer (0-7)     Middle (8-15)    Inner (16-23)
0---1---2       8---9--10        16--17--18
|       |       |       |        |       |
7       3       15      11       23      19
|       |       |       |        |       |
6---5---4       14--13--12       22--21--20
```

## Full Board
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

## 16 Mill Patterns
- Horizontal: {0,1,2} {6,5,4} {8,9,10} {14,13,12} {16,17,18} {22,21,20}
- Vertical edges: {0,7,6} {2,3,4} {8,15,14} {10,11,12} {16,23,22} {18,19,20}
- Radial: {1,9,17} {3,11,19} {5,13,21} {7,15,23}

## Adjacency
- Corners connect to 2 neighbors along their square's edges
- Midpoints connect to 2 neighbors on same square + corresponding midpoint on adjacent square(s)
- Example: pos 1 → {0, 2, 9}; pos 9 → {8, 10, 1, 17}
