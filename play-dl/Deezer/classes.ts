import { createDecipheriv } from 'node:crypto';
import { IncomingMessage } from 'node:http';
import { Readable } from 'node:stream';
import { request, request_stream } from '../Request';
import { StreamType } from '../YouTube/stream';

/**
 * Interface representing an image on Deezer
 * available in four sizes
 */
interface DeezerImage {
    /**
     * The largest version of the image
     */
    xl: string;
    /**
     * The second largest version of the image
     */
    big: string;
    /**
     * The second smallest version of the image
     */
    medium: string;
    /**
     * The smallest version of the image
     */
    small: string;
}

/**
 * Interface representing a Deezer genre
 */
interface DeezerGenre {
    /**
     * The name of the genre
     */
    name: string;
    /**
     * The thumbnail of the genre available in four sizes
     */
    picture: DeezerImage;
}

/**
 * Interface representing a Deezer user account
 */
interface DeezerUser {
    /**
     * The id of the user
     */
    id: number;
    /**
     * The name of the user
     */
    name: string;
}

/**
 * Class representing a Deezer track
 */
export class DeezerTrack {
    /**
     * The id of the track
     */
    id: number;
    /**
     * The title of the track
     */
    title: string;
    /**
     * A shorter version of the title
     */
    shortTitle: string;
    /**
     * The URL of the track on Deezer
     */
    url: string;
    /**
     * The duration of the track in seconds
     */
    durationInSec: number;
    /**
     * The rank of the track
     */
    rank: number;
    /**
     * `true` if the track contains any explicit lyrics
     */
    explicit: boolean;
    /**
     * URL to a file containing the first 30 seconds of the track
     */
    previewURL: string;
    /**
     * The artist of the track
     */
    artist: DeezerArtist;
    /**
     * The album that this track is in
     */
    album: DeezerTrackAlbum;
    /**
     * The type, always `'track'`, useful to determine what the deezer function returned
     */
    type: 'track' | 'playlist' | 'album';

    /**
     * Signifies that some properties are not populated
     *
     * Partial tracks can be populated by calling {@link DeezerTrack.fetch}.
     *
     * `true` for tracks in search results and `false` if the track was fetched directly or expanded.
     */
    partial: boolean;

    /**
     * The position of the track in the album
     *
     * `undefined` for partial tracks
     *
     * @see {@link DeezerTrack.partial}
     */
    trackPosition?: number;
    /**
     * The number of the disk the track is on
     *
     * `undefined` for partial tracks
     *
     * @see {@link DeezerTrack.partial}
     */
    diskNumber?: number;
    /**
     * The release date
     *
     * `undefined` for partial tracks
     *
     * @see {@link DeezerTrack.partial}
     */
    releaseDate?: Date;
    /**
     * The number of beats per minute
     *
     * `undefined` for partial tracks
     *
     * @see {@link DeezerTrack.partial}
     */
    bpm?: number;
    /**
     * The gain of the track
     *
     * `undefined` for partial tracks
     *
     * @see {@link DeezerTrack.partial}
     */
    gain?: number;
    /**
     * The artists that have contributed to the track
     *
     * `undefined` for partial tracks
     *
     * @see {@link DeezerTrack.partial}
     */
    contributors?: DeezerArtist[];

    /**
     * Creates a Deezer track from the data in an API response
     * @param data the data to use to create the track
     * @param partial Whether the track should be partial
     * @see {@link DeezerTrack.partial}
     */
    constructor(data: any, partial: boolean) {
        this.id = data.id;
        this.title = data.title;
        this.shortTitle = data.title_short;
        this.url = data.link;
        this.durationInSec = data.duration;
        this.rank = data.rank;
        this.explicit = data.explicit_lyrics;
        this.previewURL = data.preview;
        this.artist = new DeezerArtist(data.artist);
        this.album = new DeezerTrackAlbum(data.album);
        this.type = 'track';

        this.partial = partial;

        if (!partial) {
            this.trackPosition = data.track_position;
            this.diskNumber = data.disk_number;
            this.releaseDate = new Date(data.release_date);
            this.bpm = data.bpm;
            this.gain = data.gain;
            this.contributors = [];

            data.contributors.forEach((contributor: any) => {
                this.contributors?.push(new DeezerArtist(contributor));
            });
        }
    }

    /**
     * Fetches and populates the missing fields
     *
     * The property {@link partial} will be `false` if this method finishes successfully.
     *
     * @returns A promise with the same track this method was called on.
     */
    async fetch(): Promise<DeezerTrack> {
        if (!this.partial) return this;

        const response = await request(`https://api.deezer.com/track/${this.id}/`).catch((err: Error) => err);

        if (response instanceof Error) throw response;
        const jsonData = JSON.parse(response);

        this.partial = false;

        this.trackPosition = jsonData.track_position;
        this.diskNumber = jsonData.disk_number;
        this.releaseDate = new Date(jsonData.release_date);
        this.bpm = jsonData.bpm;
        this.gain = jsonData.gain;
        this.contributors = [];

        jsonData.contributors.forEach((contributor: any) => {
            this.contributors?.push(new DeezerArtist(contributor));
        });

        return this;
    }
    /**
     * Converts instances of this class to JSON data
     * @returns JSON data.
     */
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            shortTitle: this.shortTitle,
            url: this.url,
            durationInSec: this.durationInSec,
            rank: this.rank,
            explicit: this.explicit,
            previewURL: this.previewURL,
            artist: this.artist,
            album: this.album,
            type: this.type,
            trackPosition: this.trackPosition,
            diskNumber: this.diskNumber,
            releaseDate: this.releaseDate,
            bpm: this.bpm,
            gain: this.gain,
            contributors: this.contributors
        };
    }
}
/**
 * Class for Deezer Albums
 */
export class DeezerAlbum {
    /**
     * The id of the album
     */
    id: number;
    /**
     * The title of the album
     */
    title: string;
    /**
     * The URL to the album on Deezer
     */
    url: string;
    /**
     * The record type of the album (e.g. EP, ALBUM, etc ...)
     */
    recordType: string;
    /**
     * `true` if the album contains any explicit lyrics
     */
    explicit: boolean;
    /**
     * The artist of the album
     */
    artist: DeezerArtist;
    /**
     * The album cover available in four sizes
     */
    cover: DeezerImage;
    /**
     * The type, always `'album'`, useful to determine what the deezer function returned
     */
    type: 'track' | 'playlist' | 'album';
    /**
     * The number of tracks in the album
     */
    tracksCount: number;

    /**
     * Signifies that some properties are not populated
     *
     * Partial albums can be populated by calling {@link DeezerAlbum.fetch}.
     *
     * `true` for albums in search results and `false` if the album was fetched directly or expanded.
     */
    partial: boolean;

    /**
     * The **u**niversal **p**roduct **c**ode of the album
     *
     * `undefined` for partial albums
     *
     * @see {@link DeezerAlbum.partial}
     */
    upc?: string;
    /**
     * The duration of the album in seconds
     *
     * `undefined` for partial albums
     *
     * @see {@link DeezerAlbum.partial}
     */
    durationInSec?: number;
    /**
     * The number of fans the album has
     *
     * `undefined` for partial albums
     *
     * @see {@link DeezerAlbum.partial}
     */
    numberOfFans?: number;
    /**
     * The release date of the album
     *
     * `undefined` for partial albums
     *
     * @see {@link DeezerAlbum.partial}
     */
    releaseDate?: Date;
    /**
     * Whether the album is available
     *
     * `undefined` for partial albums
     *
     * @see {@link DeezerAlbum.partial}
     */
    available?: boolean;
    /**
     * The list of genres present in this album
     *
     * `undefined` for partial albums
     *
     * @see {@link DeezerAlbum.partial}
     */
    genres?: DeezerGenre[];
    /**
     * The contributors to the album
     *
     * `undefined` for partial albums
     *
     * @see {@link DeezerAlbum.partial}
     */
    contributors?: DeezerArtist[];

    /**
     * The list of tracks in the album
     *
     * empty (length === 0) for partial albums
     *
     * Use {@link DeezerAlbum.fetch} to populate the tracks and other properties
     *
     * @see {@link DeezerAlbum.partial}
     */
    tracks: DeezerTrack[];

    /**
     * Creates a Deezer album from the data in an API response
     * @param data the data to use to create the album
     * @param partial Whether the album should be partial
     * @see {@link DeezerAlbum.partial}
     */
    constructor(data: any, partial: boolean) {
        this.id = data.id;
        this.title = data.title;
        this.url = data.link;
        this.recordType = data.record_type;
        this.explicit = data.explicit_lyrics;
        this.artist = new DeezerArtist(data.artist);
        this.type = 'album';
        this.tracksCount = data.nb_tracks;
        this.contributors = [];
        this.genres = [];
        this.tracks = [];
        this.cover = {
            xl: data.cover_xl,
            big: data.cover_big,
            medium: data.cover_medium,
            small: data.cover_small
        };

        this.partial = partial;

        if (!partial) {
            this.upc = data.upc;
            this.durationInSec = data.duration;
            this.numberOfFans = data.fans;
            this.releaseDate = new Date(data.release_date);
            this.available = data.available;

            data.contributors.forEach((contributor: any) => {
                this.contributors?.push(new DeezerArtist(contributor));
            });

            data.genres.data.forEach((genre: any) => {
                this.genres?.push({
                    name: genre.name,
                    picture: {
                        xl: `${genre.picture}?size=xl`,
                        big: `${genre.picture}?size=big`,
                        medium: `${genre.picture}?size=medium`,
                        small: `${genre.picture}?size=small`
                    }
                });
            });

            const trackAlbum: any = {
                id: this.id,
                title: this.title,
                cover_xl: this.cover.xl,
                cover_big: this.cover.big,
                cover_medium: this.cover.medium,
                cover_small: this.cover.small,
                release_date: data.release_date
            };
            data.tracks.data.forEach((track: any) => {
                track.album = trackAlbum;
                this.tracks.push(new DeezerTrack(track, true));
            });
        }
    }

    /**
     * Fetches and populates the missing fields including all tracks.
     *
     * The property {@link DeezerAlbum.partial} will be `false` if this method finishes successfully.
     *
     * @returns A promise with the same album this method was called on.
     */
    async fetch(): Promise<DeezerAlbum> {
        if (!this.partial) return this;

        const response = await request(`https://api.deezer.com/album/${this.id}/`).catch((err: Error) => err);

        if (response instanceof Error) throw response;
        const jsonData = JSON.parse(response);

        this.partial = false;

        this.upc = jsonData.upc;
        this.durationInSec = jsonData.duration;
        this.numberOfFans = jsonData.fans;
        this.releaseDate = new Date(jsonData.release_date);
        this.available = jsonData.available;
        this.contributors = [];
        this.genres = [];
        this.tracks = [];

        jsonData.contributors.forEach((contributor: any) => {
            this.contributors?.push(new DeezerArtist(contributor));
        });

        jsonData.genres.data.forEach((genre: any) => {
            this.genres?.push({
                name: genre.name,
                picture: {
                    xl: `${genre.picture}?size=xl`,
                    big: `${genre.picture}?size=big`,
                    medium: `${genre.picture}?size=medium`,
                    small: `${genre.picture}?size=small`
                }
            });
        });

        const trackAlbum: any = {
            id: this.id,
            title: this.title,
            cover_xl: this.cover.xl,
            cover_big: this.cover.big,
            cover_medium: this.cover.medium,
            cover_small: this.cover.small,
            release_date: jsonData.release_date
        };
        jsonData.tracks.data.forEach((track: any) => {
            track.album = trackAlbum;
            this.tracks.push(new DeezerTrack(track, true));
        });

        return this;
    }
    /**
     * Fetches all the tracks in the album and returns them
     *
     * ```ts
     * const album = await play.deezer('album url')
     *
     * const tracks = await album.all_tracks()
     * ```
     * @returns An array of {@link DeezerTrack}
     */
    async all_tracks(): Promise<DeezerTrack[]> {
        await this.fetch();

        return this.tracks as DeezerTrack[];
    }
    /**
     * Converts instances of this class to JSON data
     * @returns JSON data.
     */
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            url: this.url,
            recordType: this.recordType,
            explicit: this.explicit,
            artist: this.artist,
            cover: this.cover,
            type: this.type,
            upc: this.upc,
            tracksCount: this.tracksCount,
            durationInSec: this.durationInSec,
            numberOfFans: this.numberOfFans,
            releaseDate: this.releaseDate,
            available: this.available,
            genres: this.genres,
            contributors: this.contributors,
            tracks: this.tracks.map((track) => track.toJSON())
        };
    }
}
/**
 * Class for Deezer Playlists
 */
export class DeezerPlaylist {
    /**
     * The id of the playlist
     */
    id: number;
    /**
     * The title of the playlist
     */
    title: string;
    /**
     * Whether the playlist is public or private
     */
    public: boolean;
    /**
     * The URL of the playlist on Deezer
     */
    url: string;
    /**
     * Cover picture of the playlist available in four sizes
     */
    picture: DeezerImage;
    /**
     * The date of the playlist's creation
     */
    creationDate: Date;
    /**
     * The type, always `'playlist'`, useful to determine what the deezer function returned
     */
    type: 'track' | 'playlist' | 'album';
    /**
     * The Deezer user that created the playlist
     */
    creator: DeezerUser;
    /**
     * The number of tracks in the playlist
     */
    tracksCount: number;

    /**
     * Signifies that some properties are not populated
     *
     * Partial playlists can be populated by calling {@link DeezerPlaylist.fetch}.
     *
     * `true` for playlists in search results and `false` if the album was fetched directly or expanded.
     */
    partial: boolean;

    /**
     * Description of the playlist
     *
     * `undefined` for partial playlists
     *
     * @see {@link DeezerPlaylist.partial}
     */
    description?: string;
    /**
     * Duration of the playlist in seconds
     *
     * `undefined` for partial playlists
     *
     * @see {@link DeezerPlaylist.partial}
     */
    durationInSec?: number;
    /**
     * `true` if the playlist is the loved tracks playlist
     *
     * `undefined` for partial playlists
     *
     * @see {@link DeezerPlaylist.partial}
     */
    isLoved?: boolean;
    /**
     * Whether multiple users have worked on the playlist
     *
     * `undefined` for partial playlists
     *
     * @see {@link DeezerPlaylist.partial}
     */
    collaborative?: boolean;
    /**
     * The number of fans the playlist has
     *
     * `undefined` for partial playlists
     *
     * @see {@link DeezerPlaylist.partial}
     */
    fans?: number;

    /**
     * The list of tracks in the playlist
     *
     * empty (length === 0) for partial and non public playlists
     *
     * Use {@link DeezerPlaylist.fetch} to populate the tracks and other properties
     *
     * @see {@link DeezerPlaylist.partial}
     * @see {@link DeezerPlaylist.public}
     */
    tracks: DeezerTrack[];

    /**
     * Creates a Deezer playlist from the data in an API response
     * @param data the data to use to create the playlist
     * @param partial Whether the playlist should be partial
     * @see {@link DeezerPlaylist.partial}
     */
    constructor(data: any, partial: boolean) {
        this.id = data.id;
        this.title = data.title;
        this.public = data.public;
        this.url = data.link;
        this.creationDate = new Date(data.creation_date);
        this.type = 'playlist';
        this.tracksCount = data.nb_tracks;
        this.tracks = [];

        this.picture = {
            xl: data.picture_xl,
            big: data.picture_big,
            medium: data.picture_medium,
            small: data.picture_small
        };

        if (data.user) {
            this.creator = {
                id: data.user.id,
                name: data.user.name
            };
        } else {
            this.creator = {
                id: data.creator.id,
                name: data.creator.name
            };
        }

        this.partial = partial;

        if (!partial) {
            this.description = data.description;
            this.durationInSec = data.duration;
            this.isLoved = data.is_loved_track;
            this.collaborative = data.collaborative;
            this.fans = data.fans;

            if (this.public) {
                this.tracks = data.tracks.data.map((track: any) => {
                    return new DeezerTrack(track, true);
                });
            }
        }
    }

    /**
     * Fetches and populates the missing fields, including all tracks.
     *
     * The property {@link DeezerPlaylist.partial} will be `false` if this method finishes successfully.
     *
     * @returns A promise with the same playlist this method was called on.
     */
    async fetch(): Promise<DeezerPlaylist> {
        if (!this.partial && (this.tracks.length === this.tracksCount || !this.public)) {
            return this;
        }

        if (this.partial) {
            const response = await request(`https://api.deezer.com/playlist/${this.id}/`).catch((err: Error) => err);

            if (response instanceof Error) throw response;
            const jsonData = JSON.parse(response);

            this.partial = false;

            this.description = jsonData.description;
            this.durationInSec = jsonData.duration;
            this.isLoved = jsonData.is_loved_track;
            this.collaborative = jsonData.collaborative;
            this.fans = jsonData.fans;

            if (this.public) {
                this.tracks = jsonData.tracks.data.map((track: any) => {
                    return new DeezerTrack(track, true);
                });
            }
        }

        const currentTracksCount = this.tracks.length;
        if (this.public && currentTracksCount !== this.tracksCount) {
            let missing = this.tracksCount - currentTracksCount;

            if (missing > 1000) missing = 1000;

            const promises: Promise<DeezerTrack[]>[] = [];
            for (let i = 1; i <= Math.ceil(missing / 100); i++) {
                promises.push(
                    new Promise(async (resolve, reject) => {
                        const response = await request(
                            `https://api.deezer.com/playlist/${this.id}/tracks?limit=100&index=${i * 100}`
                        ).catch((err) => reject(err));

                        if (typeof response !== 'string') return;
                        const jsonData = JSON.parse(response);
                        const tracks = jsonData.data.map((track: any) => {
                            return new DeezerTrack(track, true);
                        });

                        resolve(tracks);
                    })
                );
            }

            const results = await Promise.allSettled(promises);
            const newTracks: DeezerTrack[] = [];

            for (const result of results) {
                if (result.status === 'fulfilled') {
                    newTracks.push(...result.value);
                } else {
                    throw result.reason;
                }
            }

            this.tracks.push(...newTracks);
        }

        return this;
    }
    /**
     * Fetches all the tracks in the playlist and returns them
     *
     * ```ts
     * const playlist = await play.deezer('playlist url')
     *
     * const tracks = await playlist.all_tracks()
     * ```
     * @returns An array of {@link DeezerTrack}
     */
    async all_tracks(): Promise<DeezerTrack[]> {
        await this.fetch();

        return this.tracks as DeezerTrack[];
    }
    /**
     * Converts instances of this class to JSON data
     * @returns JSON data.
     */
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            public: this.public,
            url: this.url,
            picture: this.picture,
            creationDate: this.creationDate,
            type: this.type,
            creator: this.creator,
            tracksCount: this.tracksCount,
            description: this.description,
            durationInSec: this.durationInSec,
            isLoved: this.isLoved,
            collaborative: this.collaborative,
            fans: this.fans,
            tracks: this.tracks.map((track) => track.toJSON())
        };
    }
}

/**
 * Represents a stream from Deezer.
 */
export class DeezerStream {
    /**
     * Readable Stream through which data passes
     */
    stream: Readable;
    /**
     * Type of audio data that we recieved from normal deezer url.
     */
    type = StreamType.Arbitrary; // Deezer will be always an arbitrary stream.
    /**
     * Deezer media url.
     */
    private url: string;
    /**
     * The unique key to decode this track, created with track id and blowfish.
     */
    private decryptKey: string;
    /**
     * Incoming message that we recieve.
     *
     * Storing this is essential.
     * This helps to destroy the TCP connection completely if you stopped player in between the stream
     * @private
     */
    private request: IncomingMessage | null;

    constructor (url: string, decryptKey: string) {
        this.stream = new Readable({ highWaterMark: 16 * 1000 * 1000, read() {} });
        this.url = url;
        this.decryptKey = decryptKey;
        this.request = null;
        this.stream.on("close", () => {
            this.cleanup();
        });
        this.start();
    }

    /**
     * This cleans every used variable in class.
     *
     * This is used to prevent re-use of this class and helping garbage collector to collect it.
     */
    private cleanup() {
        this.request?.removeAllListeners();
        this.request?.destroy();
        this.url = '';
        this.request = null;
    }

    private async start() {
        const request = await request_stream(this.url).catch((err: Error) => {
            return err;
        });
        if (request instanceof Error) throw request;
        this.request = request;
        let index = 0;
        this.request
            .on("readable", () => {
                let chunk;
                while ((chunk = this.request?.read(2048))) {
                    if (index % 3 > 0 || chunk.length < 2048) {
                        this.stream.push(chunk);
                    } else {
                        const decrypt = createDecipheriv(
                            "bf-cbc",
                            this.decryptKey,
                            "\x00\x01\x02\x03\x04\x05\x06\x07"
                        );
                        decrypt.setAutoPadding(false);
                        let chunkDec = decrypt.update(
                            chunk.toString("hex"),
                            "hex",
                            "hex"
                        );
                        chunkDec += decrypt.final("hex");
                        this.stream.push(chunkDec, "hex");
                    }
                    index++;
                }
            })
            .on("end", () => {
                this.cleanup();
                this.stream.push(null);
                return;
            })
            .on("error", (err) => {
                this.cleanup();
                this.stream.emit("error", err);
                return;
            });
    }
}

class DeezerTrackAlbum {
    id: number;
    title: string;
    url: string;
    cover: DeezerImage;
    releaseDate?: Date;

    constructor(data: any) {
        this.id = data.id;
        this.title = data.title;
        this.url = `https://www.deezer.com/album/${data.id}/`;
        this.cover = {
            xl: data.cover_xl,
            big: data.cover_big,
            medium: data.cover_medium,
            small: data.cover_small
        };

        if (data.release_date) this.releaseDate = new Date(data.release_date);
    }
}
/**
 * Class representing a Deezer artist
 */
class DeezerArtist {
    /**
     * The id of the artist
     */
    id: number;
    /**
     * The name of the artist
     */
    name: string;
    /**
     * The URL of the artist on Deezer
     */
    url: string;

    /**
     * The picture of the artist available in four sizes
     */
    picture?: DeezerImage;
    /**
     * The of the artist on the track
     */
    role?: string;

    constructor(data: any) {
        this.id = data.id;
        this.name = data.name;

        this.url = data.link ? data.link : `https://www.deezer.com/artist/${data.id}/`;

        if (data.picture_xl)
            this.picture = {
                xl: data.picture_xl,
                big: data.picture_big,
                medium: data.picture_medium,
                small: data.picture_small
            };

        if (data.role) this.role = data.role;
    }
}
