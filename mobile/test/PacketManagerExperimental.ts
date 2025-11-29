const CHUNK_SIZE = 150;

export type Packet = {
  i: number;
  t: number;
  d: string;
};

export const PacketManagerExperimental = {
  chunkData(dataString: string): string[] {
    const totalChunks = Math.ceil(dataString.length / CHUNK_SIZE);
    const packets: string[] = [];

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = start + CHUNK_SIZE;
      const chunk = dataString.substring(start, end);

      const packet: Packet = { i, t: totalChunks, d: chunk };
      packets.push(JSON.stringify(packet));
    }

    return packets;
  },

  reassembleData(packetArray: Packet[]): string | null {
    if (!packetArray.length) {
      return null;
    }

    packetArray.sort((a, b) => a.i - b.i);
    const total = packetArray[0].t;

    if (packetArray.length !== total) {
      return null;
    }

    return packetArray.map(p => p.d).join('');
  }
};
