import { useEffect, useRef } from 'react';

export const tabbyPalette: Record<string, string | null> = {
  '.': null,
  O: '#181418',
  D: '#4A3F37',
  M: '#78685A',
  L: '#A69584',
  W: '#F5F2EB',
  C: '#DCD6CA',
  G: '#6EC275',
  E: '#336E3B',
  P: '#E88D98',
  R: '#B85A66',
  Y: '#FFE869',
  S: '#FFFFFF',
};

export const tabbyFrames = [
  [
    '....................................',
    '....................................',
    '....................................',
    '............O..........O............',
    '...........ODO........ODO...........',
    '...........OPMO......OMPO...........',
    '..........ODRMOOOOOOOOMRDO..........',
    '..........OMMMMOMDDMOMMMMO..........',
    '..........OMMMDMOLLOMDMMMO..........',
    '..........OMMMMDMMMMDMMMMO..........',
    '..........OMMOOOMLLMOOOMMO..........',
    '..........OODEOSMLLMSOEDOO..........',
    '..........OMMGOGMLLMGOGMMO..........',
    '..........ODOMMWWPPWWMMODO..........',
    '..........OMMMMWWDDWWMMMMO..........',
    '...........OMMMWDWWDWMMMO...........',
    '............OMMMCCCCMMMO............',
    '............OMMMMMMMMMMO............',
    '.........OOOOMMLLLLLLMMOOOO.........',
    '.......OMOMMOMOLLLLLLOMOMMOMO.......',
    '.......OMMDDMMOLDLLDLOMMDDMMO.......',
    '.......OMWWWWMOLLLLLLOMWWWWMO.......',
    '.......OMWWWWMOLLLLLLOMWWWWMO.......',
    '........OOOOOODLLLLLLDOOOOOO........',
    '............OMMLLDDLLMMO............',
    '............OMMLLLLLLMMO............',
    '............OMMLLLLLLMMO............',
    '............ODOLLLLLLODO............',
    '............OMMLLLLLLMMO............',
    '............OMMLLLLLLMMO............',
    '............OMMMMMMMMMMO............',
    '............OWWWWOOWWWWO............',
    '............OWWWWOOWWWWO............',
    '............OOOOOOOOOOOO............',
    '....................................',
    '....................................',
  ],
  [
    '....................................',
    '....................................',
    '....................................',
    '....................................',
    '...........O..........O.............',
    '..........ODO........ODO............',
    '..........OPMO......OMPO............',
    '.........ODRMOOOOOOOOMRDO...........',
    '.........OMMMMOMDDMOMMMMO...........',
    '.........OMMMDMOLLOMDMMMO...........',
    '.........OMMMMDMMMMDMMMMO...........',
    '.........OMMOOOMLLMOOOMMO...........',
    '.........OODEOSMLLMSOEDOO...........',
    '.........OMMGOGMLLMGOGMMO...........',
    '.........ODOMMWWPPWWMMODO...........',
    '.........OMMMMWWDDWWMMMMO...........',
    '.......OOOOMMMWDWWDWMMMO............',
    '.....OMOMMOMOMMCCCCMMMO.............',
    '.....OMMDDMMOMMMMMMMMMMO............',
    '.....OMWWWWMOMMLLLLLLMOOOO..........',
    '.....OMWWWWMODOLLLLLOMOMMOMO........',
    '......OOOOOOOMMLDLLDOMMDDMMO........',
    '............OMMLLLLLOMWWWWMO........',
    '............OMMLLLLLOMWWWWMO........',
    '............OODLLLLLLOOOOOO.........',
    '............OMMLLDDLLMMO............',
    '............OMMLLLLLLMMO............',
    '............OMMLLLLLLMMO............',
    '............ODOLLLLLLODO............',
    '............OMMLLLLLLMMO............',
    '............OMMLLLLLLMMO............',
    '............OMMMMMMMMMMO............',
    '............OWWWWOOWWWWO............',
    '............OWWWWOOWWWWO............',
    '............OOOOOOOOOOOO............',
    '....................................',
    '....................................',
  ],
  [
    '....................................',
    '....................................',
    '....................................',
    '.............O..........O...........',
    '............ODO........ODO..........',
    '............OPMO......OMPO..........',
    '...........ODRMOOOOOOOOMRDO.........',
    '...........OMMMMOMDDMOMMMMO.........',
    '...........OMMMDMOLLOMDMMMO.........',
    '...........OMMMMDMMMMDMMMMO.........',
    '..Y........OMMOOOMLLMOOOMMO.........',
    '.YSY.......OODEOSMLLMSOEDOO.........',
    '.SYS.......OMMGOGMLLMGOGMMO.........',
    '...........ODOMMWWPPWWMMODO.........',
    '.....OOOOOOOOMMMWWDDWWMMMMO.........',
    '....OOOOOOOOOOMMWDWWDWMMMO..........',
    '...OMDOODDOODMOMMCCCCMMMO...........',
    'YYOMMDDDDDDDDMMOMMMMMMMMO...........',
    '..OMMOMMOOMMOMMOLLLLLLMOOOO.........',
    '..OMMMMMMMMMMMMOLLLLLOMOMMOMO.......',
    '..OMMWWWWWWWWMMOLDLLDOMMDDMMO.......',
    '..OMMWWDWDWDWMMOLLLLLOMWWWWMO.......',
    '..OMMWWDWDWDWMMOLLLLLOMWWWWMO.......',
    '.SSSMWWWWWWWWMMOLLLLLLOOOOOO........',
    '...OMMCCCCCCMMOMLLDDLLMMO...........',
    '....OOOOOOOOOOYMLLLLLLMMO...........',
    '.....OOOOOOOOYSYLLLLLLMMO...........',
    '.............OYOLLLLLLODO...........',
    '.............OMMLLLLLLMMO...........',
    '.............OMMLLLLLLMMO...........',
    '.............OMMMMMMMMMMO...........',
    '.............OWWWWOOWWWWO...........',
    '.............OWWWWOOWWWWO...........',
    '.............OOOOOOOOOOOO...........',
    '....................................',
    '....................................',
  ],
];

export function TabbyLoader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    let frame = 0;
    const draw = () => {
      context.clearRect(0, 0, 36, 36);
      tabbyFrames[frame].forEach((row, y) => {
        [...row].forEach((pixel, x) => {
          const color = tabbyPalette[pixel];
          if (color) {
            context.fillStyle = color;
            context.fillRect(x, y, 1, 1);
          }
        });
      });
      frame = (frame + 1) % tabbyFrames.length;
    };

    draw();
    const interval = window.setInterval(draw, 91);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="tabby-loader" role="status" aria-label="Loading Sparq">
      <div className="loader-brand">
        <img src="/sparq-logo.jpg" alt="Sparq" />
        <strong>SPARQ</strong>
      </div>
      <canvas ref={canvasRef} width={36} height={36} />
      <div className="loader-status">
        <span className="loader-spinner" aria-hidden="true" />
        <span>Loading</span>
      </div>
    </div>
  );
}
