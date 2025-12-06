import { Component, signal, computed, effect, ViewEncapsulation, Inject, PLATFORM_ID, NgZone } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

interface Song {
  id: number;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  duration: string;
  audioUrl?: string;
}

interface Category {
  id: string;
  name: string;
  icon: string; // SVG path data (d attribute)
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  encapsulation: ViewEncapsulation.None
})
export class App {
  // --- STATE ---
  activeTab = signal('listen-now');
  isPlaying = signal(false);
  listeningTime = signal(0); // Time in seconds
  volume = signal(0.5); // Volume 0 to 1

  // Real Audio Object (Client only)
  audio: HTMLAudioElement | undefined;

  formattedTime = computed(() => {
    const totalSeconds = this.listeningTime();
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num: number) => num.toString().padStart(2, '0');

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  });

  // --- MOCK DATA ---
  navItems: Category[] = [
    {
      id: 'listen-now',
      name: 'Listen Now',
      icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z'
    },
    {
      id: 'browse',
      name: 'Browse',
      icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z'
    },
    {
      id: 'radio',
      name: 'Radio',
      icon: 'M3.24 6.15C2.51 6.43 2 7.17 2 8v12c0 1.1.9 2 2 2h16c1.11 0 2-.9 2-2V8c0-1.11-.89-2-2-2H3.24zM12 14c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm8-9.25l-7.25 2.72c-.22.08-.47.05-.66-.11L8.5 4.5c-.32-.26-.14-.76.28-.76h7.5c.37 0 .69.23.83.56l.89 2.45z'
    },
  ];

  isPixelMode = signal(false);

  togglePixelMode() {
    this.isPixelMode.update(v => !v);
  }

  // Royalty-free playlist (Archive.org)
  playlist = [
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F001.%20Alfred%20Brendel%2C%20Martin%20Sieghart%2C%20Alfred%20Brendel%20Or%20-%20Bagatelle%20for%20Piano%20in%20A%20Minor%20''Fur%20Elise''%2C%20WoO%2059.mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F002.%20Sir%20Charles%20Mackerras%20-%20Nutcracker_%20Act%20II%2C%20Scene%2012_%20Dance%20of%20the%20Mirlito.mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F003.%20Arthur%20Grumiaux%20-%20Sonata%20No.%209%20for%20Violin%20and%20Piano%20in%20%20A%20major%20-%20Kr.mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F004.%20Mario%20Del%20Monaco%20-%20Nessun%20Dorma!.mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F005.%20Sir%20Charles%20Mackerras%20-%20Nutcracker_%20Trepak%20(Russian%20Dance).mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F006.%20Orchestre%20Philharmonique%20de%20Berlin%20-%20Le%20beau%20Danube%20bleu%2C%20Op.%20314.mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F007.%20Arthur%20Grumiaux%20-%20Sonata%20No.%205%20for%20Violin%20and%20Piano%20in%20%20F%20major%20-%20Sp.mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F008.%20Martin%20Jones%2C%20Richard%20McMahon%20-%20Polka%20Italienne_%20Original%20Version%20for%20Piano%20Duet.mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F009.%20Anne-Sophie%20Mutter%2C%20Anne-Sophie%20Mutter%20-%20Concerto%20No.%204%20in%20F%20minor%20(L'inverno_%20Winter)%20RV29.mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F010.%20Bath%20Festival%20Chamber%20Orchestra%2C%20Bath%20Festival%20Orc%20-%20Brandenburg%20Concerto%20No.%203%20in%20G%20BWV1048_%20I.%20%20%20%20%5BAl.mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F011.%20Sir%20Neville%20Marriner%2C%20Academy%20Of%20St.%20Martin-In-The%20-%20Serenade%20No.%2013%20in%20G%20'Eine%20kleine%20Nachtmusik'%20K525.mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F012.%20Gerald%20Moore%2C%20Hans%20Hotter%20-%20Serenade.mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F013.%20Giuseppe%20Di%20Stefano%2C%20Orchestra%20of%20La%20Scala%20Opera%20H%20-%20La%20donna%20e%20mobile%20(from%20Rigoletto).mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F014.%20Igor%20Markevitch%2C%20Friedrich%20Gulda%20-%20Suite%20Bergamasque_%20III.%20Clair%20de%20Lune.%20Andante%20tre.mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F015.%20Dietrich%20Fischer-Dieskau%20-%20Der%20Erlkonig%20D328%20(1988%20Digital%20Remaster).mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F016.%20Walter%20Gieseking%20-%20Kinderszenen%2C%20Op.%2015%20-%20No.%207_%20Traumerei%20(Schumann).mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F017.%20Ernest%20Blanc%20-%20Carmen_%20Act%202%20-%20Votre%20toast%2C%20je%20peux%20vous%20le%20rendr.mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F018.%20Georges%20Cziffra%20-%20Fantaisie-impromptu%20in%20C%20sharp%20minor%20Op.%2066.mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F019.%20Sir%20Neville%20Marriner%2C%20Academy%20Of%20St.%20Martin-In-The%20-%20The%20Tale%20of%20Tsar%20Saltan_%20The%20Flight%20of%20the%20Bumble-.mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F020.%20Victoria%20De%20Los%20Angeles%2C%20Choeurs%20Nationals%20De%20La%20R%20-%20Carmen_%20Recit%20%26%20Habanera_%20Quand%20je%20vous%20aimerai_...mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F021.%20Karl%20Richter%20-%20Toccata%20et%20fugue%20en%20Re%20mineur%2C%20BWV%20565.mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F022.%20Sir%20Charles%20Mackerras%20-%20Nutcracker_%20Act%20I%2C%20Scene%202_%20March.mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F023.%20Sir%20Neville%20Marriner%2C%20Academy%20Of%20St.%20Martin-In-The%20-%20Suite%20No.3%20in%20D%20major%2C%20BWV1068%20(2%20oboes%2C%203%20trumpet.mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F024.%20Anne-Sophie%20Mutter%2C%20Anne-Sophie%20Mutter%2C%20English%20Ch%20-%20Concerto%20No.%202%20in%20G%20minor%20(L'estate_%20Summer)%20RV315.mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F025.%20%D0%AE%D1%80%D0%B8%D0%B9%20%D0%A1%D0%B8%D0%BC%D0%BE%D0%BD%D0%BE%D0%B2%20-%20Masquerade%20Suite%20-%20Waltz.mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F026.%20Jean-Bernard%20Pommier%20-%20Piano%20Sonata%20No.%2011%20in%20A%20major%20K331_K300i_%20III.%20%20%20.mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F027.%20Otto%20Klemperer%20-%20Die%20Walkure%20-%20Ride%20of%20the%20Valkyries%20(2002%20Digital%20.mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F028.%20Mozarteum%20Orchestra%20Salzburg%2C%20Carl%20Orff%2C%20Rudolf%20Kn%20-%20Carmina%20Burana_%20Fortuna%20Imperatrix%20Mundi_%20No.1%20''O%20.mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F029.%20%D0%AE%D1%80%D0%B8%D0%B9%20%D0%A1%D0%B8%D0%BC%D0%BE%D0%BD%D0%BE%D0%B2%20-%20Gayane%20-%20Sabre%20Dance.mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F030.%20Sir%20Thomas%20Beecham%2C%20Orchestre%20National%20De%20La%20Radio%20-%20Carmen_%20Act%203%20-%20Entr%E2%80%98acte.mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F031.%20Wilhelm%20Backhaus%20-%20Piano%20Sonata%20No.2%20in%20B%20Flat%20Minor%20Op.35_%20III.%20Marc.mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F032.%20Riccardo%20Muti%2C%20Berliner%20Philharmoniker%2C%20Swedish%20Ra%20-%20Mass%20No.%2019%20in%20D%20minor%2C%20'Requiem'%20K626_%20Lacrimosa.mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F033.%20Sir%20Thomas%20Beecham%2C%20Royal%20Philharmonic%20Orchestra%2C%20%20-%20Peer%20Gynt%20-%20Incidental%20Music_%203.%20In%20the%20Hall%20of%20th.mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F034.%20Nikolaus%20Harnoncourt%2C%20Royal%20Concertgebouw%20Orchestr%20-%20Strauss%2C%20Johann%20II%20_%20Die%20Fledermaus%20_%20Overture.mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F035.%20Itzhak%20Perlman%20-%2024%20Caprices%2C%20Op.1_%20No.%2024%20in%20A%20Minor%20(2000%20Digital.mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F036.%20Tullio%20Serafin%2C%20Orchestra%20Del%20Teatro%20Dell'Opera%20Di%20-%20La%20Traviata%20-%20Opera%20in%20three%20acts%2C%20Act%20I_%20Libiamo%20.mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F037.%20Salvatore%20Accardo%2C%20Orchestra%20Da%20Camera%20Italiana%20-%20Violin%20Concerto%20N.2%20in%20B%20Minor%20'La%20Campanella'_%20II.mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F038.%20Nigel%20Kennedy%20-%20Czardas.mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F039.%20Georges%20Cziffra%20-%2019%20Hungarian%20Rhapsodies%20S244_%20No.%202%20in%20C%20sharp%20min.mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F040.%20Luciano%20Pavarotti%2C%20The%20National%20Philharmonic%20Orche%20-%20Ave%20Maria%2C%20D839.mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F041.%20Dmitri%20Alexeev%20-%20Preludes_%20Prelude%20No.%2015%20in%20D%20flat%20'Raindrop'%20(Sos.mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F042.%20Seiji%20Ozawa%20-%20Rhapsody%20in%20Blue.mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F043.%20St%20Petersburg%20Philharmonic%20Orchestra%2C%20St%20Petersbur%20-%20Rachmaninov_%2014%20Romances%2C%20Op.%2034_%20No.%2014%20Vocalise.mp3",
    "https://archive.org/download/100-best-of-classical-songs-2022/100BestClassicSongs2022%2F044.%20Alceo%20Galliera%2C%20Philharmonia%20Orchestra%20%26%20Chorus%20-%20Act%201%2C%20Scene%201_%20La%20ran%20la%20le%20ra...Largo%20al%20factotu.mp3"
  ];

  // Demo Audio URL
  demoAudio = this.playlist[0];

  songs: Song[] = [
    { id: 1, title: 'Cruel Summer', artist: 'Taylor Swift', album: 'Lover', duration: '6:12', coverUrl: 'https://picsum.photos/seed/1/400/400', audioUrl: this.playlist[0] },
    { id: 2, title: 'Vampire', artist: 'Olivia Rodrigo', album: 'GUTS', duration: '7:15', coverUrl: 'https://picsum.photos/seed/2/400/400', audioUrl: this.playlist[1] },
    { id: 3, title: 'Seven', artist: 'Jung Kook', album: 'Golden', duration: '5:44', coverUrl: 'https://picsum.photos/seed/3/400/400', audioUrl: this.playlist[2] },
    { id: 4, title: 'Paint The Town Red', artist: 'Doja Cat', album: 'Scarlet', duration: '5:02', coverUrl: 'https://picsum.photos/seed/4/400/400', audioUrl: this.playlist[3] },
    { id: 5, title: 'Dance The Night', artist: 'Dua Lipa', album: 'Barbie Album', duration: '5:53', coverUrl: 'https://picsum.photos/seed/5/400/400', audioUrl: this.playlist[4] },
    { id: 6, title: 'Flowers', artist: 'Miley Cyrus', album: 'Endless Summer Vacation', duration: '5:46', coverUrl: 'https://picsum.photos/seed/6/400/400', audioUrl: this.playlist[5] },
    { id: 7, title: 'Anti-Hero', artist: 'Taylor Swift', album: 'Midnights', duration: '4:21', coverUrl: 'https://picsum.photos/seed/7/400/400', audioUrl: this.playlist[6] },
    { id: 8, title: 'As It Was', artist: 'Harry Styles', album: 'Harry\'s House', duration: '5:20', coverUrl: 'https://picsum.photos/seed/8/400/400', audioUrl: this.playlist[7] },
    { id: 9, title: 'Rich Flex', artist: 'Drake & 21 Savage', album: 'Her Loss', duration: '4:48', coverUrl: 'https://picsum.photos/seed/9/400/400', audioUrl: this.playlist[8] },
    { id: 10, title: 'Kill Bill', artist: 'SZA', album: 'SOS', duration: '6:12', coverUrl: 'https://picsum.photos/seed/10/400/400', audioUrl: this.playlist[9] },
    { id: 11, title: 'Creepin\'', artist: 'Metro Boomin', album: 'Heroes & Villains', duration: '5:33', coverUrl: 'https://picsum.photos/seed/11/400/400', audioUrl: this.playlist[10] },
    { id: 12, title: 'Die For You', artist: 'The Weeknd', album: 'Starboy', duration: '6:10', coverUrl: 'https://picsum.photos/seed/12/400/400', audioUrl: this.playlist[11] },
    { id: 13, title: 'Last Night', artist: 'Morgan Wallen', album: 'One Thing At A Time', duration: '6:30', coverUrl: 'https://picsum.photos/seed/13/400/400', audioUrl: this.playlist[12] },
    { id: 14, title: 'Calm Down', artist: 'Rema & Selena Gomez', album: 'Rave & Roses', duration: '5:27', coverUrl: 'https://picsum.photos/seed/14/400/400', audioUrl: this.playlist[13] },
    { id: 15, title: 'Boy\'s a liar Pt. 2', artist: 'PinkPantheress', album: 'Take me home', duration: '4:35', coverUrl: 'https://picsum.photos/seed/15/400/400', audioUrl: this.playlist[14] },
    { id: 16, title: 'Fast Car', artist: 'Luke Combs', album: 'Gettin\' Old', duration: '7:05', coverUrl: 'https://picsum.photos/seed/16/400/400', audioUrl: this.playlist[15] },
    { id: 17, title: 'Chemical', artist: 'Post Malone', album: 'Austin', duration: '6:12', coverUrl: 'https://picsum.photos/seed/17/400/400', audioUrl: this.playlist[16] },
    { id: 18, title: 'All My Life', artist: 'Lil Durk', album: 'Almost Healed', duration: '7:15', coverUrl: 'https://picsum.photos/seed/18/400/400', audioUrl: this.playlist[17] },
    { id: 19, title: 'Ella Baila Sola', artist: 'Eslabon Armado', album: 'Desvelado', duration: '5:44', coverUrl: 'https://picsum.photos/seed/19/400/400', audioUrl: this.playlist[18] },
    { id: 20, title: 'Unholy', artist: 'Sam Smith', album: 'Gloria', duration: '5:02', coverUrl: 'https://picsum.photos/seed/20/400/400', audioUrl: this.playlist[19] },
    { id: 21, title: 'Super Shy', artist: 'NewJeans', album: 'Get Up', duration: '5:53', coverUrl: 'https://picsum.photos/seed/21/400/400', audioUrl: this.playlist[20] },
    { id: 22, title: 'Daylight', artist: 'David Kushner', album: 'Daylight', duration: '5:46', coverUrl: 'https://picsum.photos/seed/22/400/400', audioUrl: this.playlist[21] },
    { id: 23, title: 'I Remember Everything', artist: 'Zach Bryan', album: 'Zach Bryan', duration: '4:21', coverUrl: 'https://picsum.photos/seed/23/400/400', audioUrl: this.playlist[22] },
    { id: 24, title: 'What Was I Made For?', artist: 'Billie Eilish', album: 'Barbie Album', duration: '5:20', coverUrl: 'https://picsum.photos/seed/24/400/400', audioUrl: this.playlist[23] },
    { id: 25, title: 'Lala', artist: 'Myke Towers', album: 'La Vida Es Una', duration: '4:48', coverUrl: 'https://picsum.photos/seed/25/400/400', audioUrl: this.playlist[24] },
    { id: 26, title: 'Blank Space', artist: 'Taylor Swift', album: '1989', duration: '6:12', coverUrl: 'https://picsum.photos/seed/26/400/400', audioUrl: this.playlist[25] },
    { id: 27, title: 'Style', artist: 'Taylor Swift', album: '1989', duration: '5:33', coverUrl: 'https://picsum.photos/seed/27/400/400', audioUrl: this.playlist[26] },
    { id: 28, title: 'Bad Blood', artist: 'Taylor Swift', album: '1989', duration: '6:10', coverUrl: 'https://picsum.photos/seed/28/400/400', audioUrl: this.playlist[27] },
    { id: 29, title: 'Shake It Off', artist: 'Taylor Swift', album: '1989', duration: '6:30', coverUrl: 'https://picsum.photos/seed/29/400/400', audioUrl: this.playlist[28] },
    { id: 30, title: 'Midnight City', artist: 'M83', album: 'Hurry Up, We\'re Dreaming', duration: '5:27', coverUrl: 'https://picsum.photos/seed/30/400/400', audioUrl: this.playlist[29] },
    { id: 31, title: 'Heroes', artist: 'David Bowie', album: 'Heroes', duration: '4:35', coverUrl: 'https://picsum.photos/seed/31/400/400', audioUrl: this.playlist[30] },
    { id: 32, title: 'Starman', artist: 'David Bowie', album: 'Ziggy Stardust', duration: '7:05', coverUrl: 'https://picsum.photos/seed/32/400/400', audioUrl: this.playlist[31] },
    { id: 33, title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera', duration: '6:12', coverUrl: 'https://picsum.photos/seed/33/400/400', audioUrl: this.playlist[32] },
    { id: 34, title: 'Hotel California', artist: 'Eagles', album: 'Hotel California', duration: '7:15', coverUrl: 'https://picsum.photos/seed/34/400/400', audioUrl: this.playlist[33] },
    { id: 35, title: 'Sweet Child O\' Mine', artist: 'Guns N\' Roses', album: 'Appetite for Destruction', duration: '5:44', coverUrl: 'https://picsum.photos/seed/35/400/400', audioUrl: this.playlist[34] },
    { id: 36, title: 'Smells Like Teen Spirit', artist: 'Nirvana', album: 'Nevermind', duration: '5:02', coverUrl: 'https://picsum.photos/seed/36/400/400', audioUrl: this.playlist[35] },
    { id: 37, title: 'Billie Jean', artist: 'Michael Jackson', album: 'Thriller', duration: '5:53', coverUrl: 'https://picsum.photos/seed/37/400/400', audioUrl: this.playlist[36] },
    { id: 38, title: 'Thriller', artist: 'Michael Jackson', album: 'Thriller', duration: '5:46', coverUrl: 'https://picsum.photos/seed/38/400/400', audioUrl: this.playlist[37] },
    { id: 39, title: 'Beat It', artist: 'Michael Jackson', album: 'Thriller', duration: '4:21', coverUrl: 'https://picsum.photos/seed/39/400/400', audioUrl: this.playlist[38] },
    { id: 40, title: 'Take On Me', artist: 'a-ha', album: 'Hunting High and Low', duration: '5:20', coverUrl: 'https://picsum.photos/seed/40/400/400', audioUrl: this.playlist[39] },
  ];

  newReleases: Song[] = [
    { id: 41, title: 'Houdini', artist: 'Dua Lipa', album: 'Houdini', duration: '3:05', coverUrl: 'https://picsum.photos/seed/41/400/400', audioUrl: this.playlist[40] },
    { id: 42, title: 'Is It Over Now?', artist: 'Taylor Swift', album: '1989 (TV)', duration: '3:49', coverUrl: 'https://picsum.photos/seed/42/400/400', audioUrl: this.playlist[41] },
    { id: 43, title: 'Agora Hills', artist: 'Doja Cat', album: 'Scarlet', duration: '4:25', coverUrl: 'https://picsum.photos/seed/43/400/400', audioUrl: this.playlist[42] },
    { id: 44, title: 'Water', artist: 'Tyla', album: 'Tyla', duration: '3:20', coverUrl: 'https://picsum.photos/seed/44/400/400', audioUrl: this.playlist[43] },
  ];

  currentSong = signal<Song>(this.songs[0]);
  isPlayerOpen = signal(false);
  isPlayerVisible = signal(false);

  // Reward System & Timer
  streak = signal(0);
  visualizerBars = new Array(50); // For generating visualizer bars
  showReward = signal(false);
  currentSongTime = signal(0); // Current song progress in seconds
  audioDuration = signal(0); // Add duration signal

  songProgressPercent = computed(() => {
    const duration = this.audioDuration();
    if (!duration || duration === 0) return 0;
    return (this.currentSongTime() / duration) * 100;
  });

  // Goal: 100,000 minutes = 6,000,000 seconds
  goalProgressPercent = computed(() => {
    const GOAL_SECONDS = 60000; // Demo mode: 1 minute goal
    return (this.listeningTime() / GOAL_SECONDS) * 100;
  });

  remainingGoalTime = computed(() => {
    const GOAL_MINUTES = 1000; // Demo mode: 1 minute goal
    const listenedMinutes = Math.floor(this.listeningTime() / 60);
    const remaining = Math.max(0, GOAL_MINUTES - listenedMinutes); // Ensure non-negative
    return remaining.toLocaleString();
  });

  formattedCurrentTime = computed(() => this.formatTime(this.currentSongTime()));

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private ngZone: NgZone) {
    if (isPlatformBrowser(this.platformId)) {
      this.audio = new Audio();
      // Configure global audio events
      this.audio.volume = 0.5;

      this.audio.addEventListener('loadedmetadata', () => {
        this.ngZone.run(() => {
          if (this.audio) this.audioDuration.set(this.audio.duration);
        });
      });

      this.audio.addEventListener('durationchange', () => {
        this.ngZone.run(() => {
          if (this.audio) this.audioDuration.set(this.audio.duration);
        });
      });

      this.audio.addEventListener('timeupdate', () => {
        this.ngZone.run(() => {
          if (this.audio) this.currentSongTime.set(this.audio.currentTime);
        });
      });

      this.audio.addEventListener('ended', () => {
        this.ngZone.run(() => {
          this.next();
        });
      });

      // Error handling (auto-recovery for demo)
      this.audio.addEventListener('error', (e) => {
        console.error("Audio error", e);
      });
    }

    effect((onCleanup) => {
      let interval: any;

      // Global timer for rewards only (independent of song progress)
      if (this.isPlaying()) {
        interval = setInterval(() => {
          this.listeningTime.update(t => t + 1);

          // Reward System
          if (this.listeningTime() > 0 && this.listeningTime() % 30 === 0) {
            this.streak.update(s => s + 1);
            this.showReward.set(true);
            setTimeout(() => this.showReward.set(false), 3000);
          }
        }, 1000);
      }

      onCleanup(() => {
        if (interval) clearInterval(interval);
      });
    });

    // Persistence for Pixel Mode
    if (isPlatformBrowser(this.platformId)) {
      const savedMode = localStorage.getItem('pixelMode');
      if (savedMode !== null) {
        this.isPixelMode.set(savedMode === 'true');
      }
    }

    effect(() => {
      const isPixel = this.isPixelMode();
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('pixelMode', String(isPixel));
      }
    });
  }

  // --- LOGIC ---
  togglePlay() {
    if (!this.audio) return;
    if (this.audio.paused) {
      this.audio.play();
      this.isPlaying.set(true);
    } else {
      this.audio.pause();
      this.isPlaying.set(false);
    }
  }

  seek(event: MouseEvent) {
    if (!this.audio) return;

    const element = event.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;

    // Calculate new time
    const newTime = percentage * this.audio.duration;

    // Update audio
    if (!isNaN(newTime) && isFinite(newTime)) {
      this.audio.currentTime = newTime;
      this.currentSongTime.set(newTime);
    }
  }

  setVolume(event: any) {
    if (!this.audio) return;
    const vol = event.target.value / 100;
    this.audio.volume = vol;
    this.volume.set(vol);
  }

  setVolumeOnClick(event: MouseEvent) {
    if (!this.audio) return;
    const element = event.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const width = rect.width;
    let newVolume = clickX / width;

    // Clamp volume between 0 and 1
    newVolume = Math.max(0, Math.min(1, newVolume));

    this.audio.volume = newVolume;
    this.volume.set(newVolume);
  }

  playRandomSong() {
    const allSongs = [...this.songs, ...this.newReleases];
    const randomIndex = Math.floor(Math.random() * allSongs.length);
    this.playSong(allSongs[randomIndex]);
  }

  playSong(song: Song) {
    this.currentSong.set(song);
    this.isPlayerVisible.set(true);

    if (this.audio) {
      // Use song audio or fallback to demo
      this.audio.src = song.audioUrl || this.demoAudio;
      this.audio.load();
      this.audio.play().then(() => {
        this.isPlaying.set(true);
      }).catch(err => {
        console.error("Playback failed", err);
        this.isPlaying.set(false);
      });
    }
  }

  // --- HELPERS ---
  parseDuration(duration: string): number {
    const parts = duration.split(':').map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  }

  formatTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  next() {
    const currentIndex = this.songs.findIndex(s => s.id === this.currentSong().id);
    const nextIndex = (currentIndex + 1) % this.songs.length;
    this.playSong(this.songs[nextIndex]);
  }

  previous() {
    const currentIndex = this.songs.findIndex(s => s.id === this.currentSong().id);
    const prevIndex = currentIndex === 0 ? this.songs.length - 1 : currentIndex - 1;
    this.playSong(this.songs[prevIndex]);
  }
}
