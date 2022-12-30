const Discord = require("discord.js");
const { prefix, token } = require("./config.json");
const ytdl = require("ytdl-core");

const client = new Discord.Client();

const queue = new Map();

client.once("ready", () => {
  console.log("Ready!");
});

client.once("reconnecting", () => {
  console.log("Reconnecting!");
});

client.once("disconnect", () => {
  console.log("Disconnrct!");
});

client.on("message", async message => {
  // 도움말
  if (message.content.startsWith("안녕")) {
    const embed = new Discord.MessageEmbed()
    .setTitle("도움말")
    .setColor('#F900D8')
    .setDescription('test-1 명령어')
    .addField("노래봇", "노래봇 명령어들이 있습니다")
    .addField("게임", "준비중임")
    message.channel.send(embed)
  }
  
  //노래봇 명령어 도움말
  if (message.content.startsWith("노래봇")) {
    const embed = new Discord.MessageEmbed()
    .setTitle("노래봇 도움말")
    .setColor("#F900D8")
    .setDescription('test-1 노래 명령어')
    .addField("!play (youtude link)", "유튜브 음원을 재생합니다")
    .addField("skip", "음원을 스킵합니다")
    .addField("!stop", "음원을 멈춥니다")
    message.channel.send(embed)
  }
  //노래봇 코드
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const serverQueue = queue.get(message.guild.id);

  if (message.content.startsWith(`${prefix}play`)) {
    execute(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}skip`)) {
    skip(message, serverQueue);
    return;
  } else if(message.content.startsWith(`${prefix}stop`)) {
    stop(message, serverQueue);
    return;
  } else {
    message.channel.send("유효한 명령을 입력해야해!");
  } 
});

async function execute(message, serverQueue) {
  const args = message.content.split(" ");

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel)
    return message.channel.send(
      "노래를 틀기위해서는 음성채널에 들어가 있어야함"
    );
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send(
      "노래를 듣기전에 음성채널에 참가하고 말을 할 수 있는 권한이 필요함"
    );
  }

  const songInfo = await ytdl.getInfo(args[1]);
  const song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
  };

  if (!serverQueue) {
    const queueContruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volum: 5,
      playing: true
    };

    queue.set(message.guild.id, queueContruct);

    queueContruct.songs.push(song);

    try {
      var connection = await voiceChannel.join();
      queueContruct.connection = connection;
      play(message.guild, queueContruct.songs[0]);
    } catch (err) {
      console.log(err);
      queue.delete(message.guild.id);
      return message.channel.send(err);
    }
  } else {
    serverQueue.songs.push(song);
    return message.channel.send(`${song.title} 대기열에 추가 됐음`);
  }
}

function skip(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "노래를 넘길려면 음성 채널에 있어야함"
    );
  if (!serverQueue)
    return message.channel.send("넘길 노래가 없음");
  serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "노래를 멈추기 위해서는 음성 채널에 있어야함"
    );
  
  if (!serverQueue)
    return message.channel.send("멈출 수 있는 노래가 없음");
  
  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
}

function play(guild, song) {
  const serverQueue = queue.get(guild.id);
  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }

  const dispatcher = serverQueue.connection
    .play(ytdl(song.url))
    .on("끝남", () => {
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
    })
    .on("error", error => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volum / 5);
  serverQueue.textChannel.send(`노래를 시작함: **${song.title}**`);
}
client.login("ODQ5MjgyMTE5OTE4Mjg4OTE2.GgSCaW.r1fIIrk0qZvwJ11CcOJRnLGYSrsddzJoNl-hM4");