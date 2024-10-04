//This variable is in charge of running YouTube videos on the same iframe
var youtubePlayer;
//common string before youtube video id
var youtubePrefix = 'https://www.youtube.com/watch?v=';
//number that controls the youtube URL length: https://www.youtube.com/watch?v=12345678901
var youtubeURLlength = 43;

//This variable is in charge of running SoundCloud tracks on the same iframe
var soundcloudPlayer;
//common string before soundcloud track name
var soundcloudPrefix = 'https://soundcloud.com/';

//This variable is in charge of running Vimeo tracks on the same iframe
var vimeoPlayer;
//common string before vimeo video id
var vimeoPrefix = 'https://vimeo.com/';
//number that controls the vimeo URL length: https://vimeo.com/123456789
var vimeoURLlength = 27;

//This variable is in charge of running DailyMotion tracks on the same iframe
var dailymotionPlayer;
//common string before dailymotion video id
var dailymotionPrefix = 'http://www.dailymotion.com/video/';
//number that controls the dailymotion URL length: http://www.dailymotion.com/video/1234567
var dailymotionURLlength = 40;

//booleans that check if at least one SoundCloud, Vimeo, and DailyMotion link was found
var SCfound = false;
var VMfound = false;
var DMfound = false;

//This array will hold the URLs to the videos/tracks
var links = new Array();

//This array will hold each whole line from the file
var filelines = new Array();

//This array will keep the indices for the song order
var order = new Array();

//counter to keep track of the number of songs player
var counter = 0;

//boolean to keep track of which iframe is showing
var activeIframe = '';

//boolean to shuffle the playlist
var shuffle = false;

//boolean to repeat the playlist
var repeat = false;

//boolean to re-shuffle on playlist repeat
var reshuffle = false;

//boolean to check if either of the players are paused
var paused = false;

//boolean to check if the playback buttons (Previous, Play/Pause, Next) are disabled
var playbackdisabled = true;

//string and integer to hold an error line and line number in the file being read
var errorline = '';
var linenumber = 0;

//boolean to control when the songs transition from one to another
var inTransition = false;

//information about the video
var videoTitle;
var videoArtwork;
var videoDuration;

//text variables that define the guidelines
var youtubeGuidelines = '<ul><li>Note that each video has an 11 digit id. While the program can extract the necessary info to load a video, you only need to copy up to the 11 characters of the id</li><li>Because this program reads from direct URLs, video links like https://youtu.be/2VucwWEujuo will not work</li></ul>';
var soundcloudGuidelines = '<ul><li>Sometimes the track\'s progress bar will not be visible. Clicking on the pause and play button twice should fix the issue</li><li>Because SoundCloud URLs include description provided by authors and not IDs, appropriate format cannot be checked. If you provide a wrong URL, it may pass to play, but an error will occur</li></ul>';
var vimeoGuidelines = '<ul><li>Each video has a 9 digit id. As such, the program only needs to get as much as this sample URL: https://vimeo.com/123456789</li></ul>';
var dailymotionGuidelines = '<ul><li>Each video has a 7 digit id, so any working URL like this will do: http://www.dailymotion.com/video/1234567<li>DailyMotion is unfortunately teeming with ads. Thus, loading one video from there may trigger between 0-2 ads depending on your browser protection or plugins/extensions (like adblock or ublock)</li></ul>';

$(function() {
  $('#urlplayercontainer').css({background: 'rgb(0, 0, 0)'});
  // document.body.style.background = 'rgb(0, 0, 0)';
  loadMediaScripts();
  $('#upbtn').on('click', () => createComponents());

  //function to resize the filedata element to avoid shifiting the content down upon file load
  setInterval(function() {
    $('#upfiledata').css('height', parseInt($('#upfiledata').css('font-size')));
  }, 500);

	//When the file input changes, it will check for a file and extract its content
  $('#upfilein').change(function() {
    var fileext = $('#upfilein').val().substr($('#upfilein').val().lastIndexOf('.') + 1);

    if (fileext != 'txt') showError('type');
    else {
      filelines = [];
      links = [];
      order = [];
      var linesok = true;

      var fileData = this.files[0];
      var fr = new FileReader();
      fr.onload = function() {
  			var filedata = this.result.split('\n');

  			//Loop to add each line to the links array. Trim is used to avoid the \r
  			for (var i = 0; i < filedata.length; i++)  {
          var line = filedata[i].trim();

          //if the current line is blank, skip to the next one
          if (line == '') continue;

          //checks if the line being read is either a youtube or soundcloud URL
          if (!line.includes(youtubePrefix) && !line.includes(soundcloudPrefix) && !line.includes(vimeoPrefix) && !line.includes(dailymotionPrefix)) {
            linesok = false;
            errorline = line;
            linenumber = i + 1;

            break;
          }
          //if no error was found, add it to the line holder for error checking in the future
          else {
            filelines.push(line);
          }

          //if it is a youtube URL, check its length, and shorten to up to the ID
          if (line.includes(youtubePrefix) && line.length > youtubeURLlength) {
            var urlstart = line.indexOf(youtubePrefix);
            line = line.substring(urlstart, (urlstart + youtubeURLlength));
          }
          //for soundcloud, find the beginning of the link and get up to the end
          else if (line.includes(soundcloudPrefix)) {
            var urlstart = line.indexOf(soundcloudPrefix);
            line = line.substring(urlstart, line.length);
          }
          //for vimeo, check its length, and shorten to up to the ID
          else if (line.includes(vimeoPrefix)) {
            var urlstart = line.indexOf(vimeoPrefix);
            line = line.substring(urlstart, (urlstart + vimeoURLlength));
          }
          //for vimeo, check its length, and shorten to up to the ID
          else if (line.includes(dailymotionPrefix)) {
            var urlstart = line.indexOf(dailymotionPrefix);
            line = line.substring(urlstart, (urlstart + dailymotionURLlength));
          }

  				links.push(line);
  				order.push(i);
  			}

        if (linesok) {
          $('#upfilename').html($('#upfilein').val().replace(/C:\\fakepath\\/, ''));
          $('#upfiledata').html('This file has ' + links.length + ' links to play')

  				//Since there is a loaded list, the button to play can now be enabled
  				$('#upbtn').prop('disabled', false);
        }
        //since there is at least one error, the arrays are emptied out and an error is shown
        else {
          filelines = [];
          links = [];
          order = [];
          showError('line');
        }
  		};
      fr.readAsText(fileData);
    }
  });

  //attaching onmouseover image changes to the playback buttons
  $('#prevbtn').hover(function() {
    if (!inTransition) $('#prevbtn').attr('src', './buttons/active/prev.png');
  });
  $('#playpausebtn').hover(function() {
    if (!inTransition) {
      if (paused) $('#playpausebtn').attr('src', './buttons/active/play.png');
      else $('#playpausebtn').attr('src', './buttons/active/pause.png');
    }
  });
  $('#nextbtn').hover(function() {
    if (!inTransition) $('#nextbtn').attr('src', './buttons/active/next.png');
  });
  $('#forcebtn').mouseout(function() {
    $('#forcebtn').attr('src', './buttons/hover/forceplay.png');
  });

  //attaching onmouseout image changes to the playback buttons
  $('#prevbtn').mouseout(function() {
    if (!inTransition) $('#prevbtn').attr('src', './buttons/prev.png');
  });
  $('#playpausebtn').mouseout(function() {
    if (!inTransition) {
      if (paused) $('#playpausebtn').attr('src', './buttons/play.png');
      else $('#playpausebtn').attr('src', './buttons/pause.png');
    }
  });
  $('#nextbtn').mouseout(function() {
    if (!inTransition) $('#nextbtn').attr('src', './buttons/next.png');
  });
  $('#forcebtn').mouseout(function() {
    $('#forcebtn').attr('src', './buttons/forceplay.png');
  });

  $('#forcebtn').click(function() {
    $('#forcebtn').attr('src', './buttons/active/forceplay.png');
    forcePlay();
  });

  //at the beginning, the youtube guidelines are set into the guidelines div
  $('#guidelines').html(youtubeGuidelines);
});

function loadMediaScripts() {
  const youtubeScript = document.createElement("script");
  const soundCloudScript = document.createElement("script");
  const vimeoScript = document.createElement("script");
  const dailyMotionScript = document.createElement("script");

  youtubeScript.src = "https://www.youtube.com/iframe_api";
  youtubeScript.async = true;

  soundCloudScript.src = "https://w.soundcloud.com/player/api.js";
  soundCloudScript.async = true;

  vimeoScript.src = "https://player.vimeo.com/api/player.js";
  vimeoScript.async = true;

  dailyMotionScript.src = "https://api.dmcdn.net/all.js";
  dailyMotionScript.async = true;

  document.body.appendChild(youtubeScript);
  document.body.appendChild(soundCloudScript);
  document.body.appendChild(vimeoScript);
  document.body.appendChild(dailyMotionScript);
}

export function browseTxtFile() {
  $('#upfilein').click();
}

export function toggleButton(type) {
  if (type == 'shuffle') {
    shuffle = !shuffle;
    if (shuffle) $('#upimgshuffle').attr('src', './buttons/active/shuffle.png');
    else $('#upimgshuffle').attr('src', './buttons/shuffle.png');
  }
  else if (type == 'repeat') {
    repeat = !repeat;
    if (repeat) $('#upimgrepeat').attr('src', './buttons/active/repeat.png');
    else $('#upimgrepeat').attr('src', './buttons/repeat.png');
  }
  else if (type == 'reshuffle') {
    reshuffle = !reshuffle;
    if (reshuffle) $('#upimgreshuffle').attr('src', './buttons/active/reshuffle.png');
    else $('#upimgreshuffle').attr('src', './buttons/reshuffle.png');
  }
}

function showError(type) {
  $('#upbtn').prop('disabled', true);

  if (type == 'type') $('#uperrmessage').html('This file cannot be used as its extension is not .txt');
  else if (type == 'line') $('#uperrmessage').html('This file cannot be used as there is an error or HTML on line ' + linenumber + ':<br><br>' + errorline + '<br><br>Modify your file and upload again');

  $('#uperror').css({opacity: 1, 'z-index': 100});
  document.getElementById('cover').style.visibility = 'visible';
}

export function showHelp(type) {
  if (type == 'get') $('#uphelp').css({opacity: 1, 'z-index': 100});
  else if (type == 'tips') $('#uptips').css({opacity: 1, 'z-index': 100});
  else if (type == 'guides') $('#upguidelines').css({opacity: 1, 'z-index': 100});

  document.getElementById('cover').style.visibility = 'visible';
}

export function hideMessage() {
  if ($('#uperror').css('opacity') == 1) {
    $('#upfilein').val('');
    $('#uperror').css({'z-index': -1, opacity: 0});
  }
  else if ($('#uphelp').css('opacity') == 1) $('#uphelp').css({'z-index': -1, opacity: 0});
  else if ($('#uptips').css('opacity') == 1) $('#uptips').css({'z-index': -1, opacity: 0});
  else if ($('#upguidelines').css('opacity') == 1) $('#upguidelines').css({'z-index': -1, opacity: 0});
  document.getElementById('cover').style.visibility = 'hidden';
}

export function createComponents() {
  //the main menu is hidden to avoid conflicts with current play
  $('#upmainmenu').css({opacity: 0, height: '0px'});
  $('#upmainmenu').one('transitionend', function() {
    //Once hidden, the music menu can be shown
    $('#upmainmenu').hide();
    $('#upmusicmenu').css({opacity: 1});
    $('#holder').css({height: '50vh', width: '100%'});

    //if on mobile, the forceplay button is shown
    // if (onMobile) {
    //   alert('Mobile users: Due to autoplay options disabled by default, you may need to sometimes make use of the ForcePlay button provided');
    //   $('#fbtndiv').css({opacity: 1});
    // }

    //Options to activate based on buttons enabled
  	if (shuffle) shuffleOrder();

  	//div created to use for the YouTube iframe
  	$('#holder').append("<div id='youtubeplayer' style='display: none;'></div>");

  	//the YouTube player is initialized. Upon finish, the tracks are loaded via loadTracks. Track change upon state change is handled by youtubeStateChange
  	youtubePlayer = new YT.Player('youtubeplayer', {
  		height: '99%',
  		width: '99%',
  		events: {
  			'onReady': loadTracks,
  			'onStateChange': youtubeStateChange,
        'onError': playerError
  		}
  	});
  });
}

function loadTracks() {
	//loop to parse through the array
	for(var i = 0; i < links.length; i++) {
		//if the URL is from SoundCloud and the player doesn't exist, create it and load the SoundCloud iframe with the first sound
		if (links[order[i]].includes('soundcloud') && $('#soundcloudplayer').length == 0){
			//create an iframe for the soundcloud player
      SCfound = true;
			$('#holder').append("<iframe id='soundcloudplayer' style='width: 99%; height: 99%; display: none;' scrolling='no' frameborder='no' src='https://w.soundcloud.com/player?url=" + links[order[i]] + "&auto_play=false&show_comments=false&visual=true'></iframe>");
			if (VMfound && DMfound) break;
		}
    //if the URL is from Vimeo and the player doesn't exist, create it
    else if (links[order[i]].includes('vimeo') && $('#vimeoplayer').length == 0) {
      VMfound = true;
      $('#holder').append("<div id='vimeoplayer' style='width: 99%; height: 99%; text-align: center; display: none;'></div>");
      if (SCfound && DMfound) break;
    }
    //if the URL is from DailyMotion and the player doesn't exist, create it
    else if (links[order[i]].includes('dailymotion') && $('#dailymotionplayer').length == 0) {
      VMfound = true;
      $('#holder').append("<div id='dailymotionplayer' style='width: 99%; height: 99%; text-align: center; display: none;'></div>");
      if (SCfound && DMfound) break;
    }
	}

  if (!SCfound) $('#holder').append("<iframe id='soundcloudplayer' style='width: 99%; height: 99%; display: none;' scrolling='no' frameborder='no' src='https://w.soundcloud.com/player?url=fake&auto_play=false&show_comments=false&visual=true'></iframe>");

	soundcloudPlayer = SC.Widget(document.getElementById('soundcloudplayer'));

	bindSoundCloudEvents();
}

function bindSoundCloudEvents() {
  //When the soundcloud player is ready, the first song can be played
	soundcloudPlayer.bind(SC.Widget.Events.READY, function() {
		playCurrentSong();
	});

	//When the current track finishes, it must call the playNextSong to continue
	soundcloudPlayer.bind(SC.Widget.Events.FINISH, function() {
		if (counter < links.length - 1 || (counter == links.length - 1 && repeat)) playNextSong();
	});

	//When the track is paused, the boolean must be changed accordingly
	soundcloudPlayer.bind(SC.Widget.Events.PAUSE, function() {
		if (!paused) changePause(true);
	});

	//When the track is resumed, the boolean must be changed accordingly
	soundcloudPlayer.bind(SC.Widget.Events.PLAY, function() {
    onPlay();
	});

  //When the track cannot be loaded, the playerError function is called
  soundcloudPlayer.bind(SC.Widget.Events.ERROR, function() {
    if (SCfound && activeIframe == 'soundcloud') playerError();
	});
}

function bindVimeoEvents() {
  vimeoPlayer.on('load', function() {
    //console.log('Vimeo video successfully loaded');
  });
  vimeoPlayer.on('ended', function() {
    if (counter < links.length - 1 || (counter == links.length - 1 && repeat)) playNextSong();
  });
  vimeoPlayer.on('pause', function() {
    if (!paused) changePause(true);
  });
  vimeoPlayer.on('play', function() {
    onPlay();
  });
  vimeoPlayer.on('error', function(e) {
    if (e.name != 'TypeError' && e.name != 'Error' && activeIframe == 'vimeo') {
      playerError();
    }
  });
}

function bindDailyMotionEvents() {
  dailymotionPlayer.addEventListener('videochange', function() {
    dailymotionPlayer.play();
  });

  dailymotionPlayer.addEventListener('video_end', function() {
    if (counter < links.length - 1 || (counter == links.length - 1 && repeat)) playNextSong();
  });

  dailymotionPlayer.addEventListener('pause', function() {
    if (!paused) changePause(true);
  });

  dailymotionPlayer.addEventListener('play', function() {
    onPlay();
  });
}

function youtubeStateChange(e) {
	if (e.data == YT.PlayerState.ENDED) {
		if (counter < links.length - 1 || (counter == links.length - 1 && repeat)) playNextSong();
	}
	else if (e.data == YT.PlayerState.PAUSED) {
		if (!paused) changePause(true);
	}
	else if (e.data == YT.PlayerState.PLAYING) {
    onPlay();
	}

}

function onPlay() {
  inTransition = false;
  if (paused) changePause(false);
  if (playbackdisabled) togglePlayBack(false);
}

//If there is an error with the URL played, it will skip to the next song in 5 seconds
function playerError() {
  console.log('Error while playing line: ' + filelines[order[counter]]);
  setTimeout(function () {
      playNextSong();
  }, 5000);
}

//All playNextSong does is increment the song counter. If this is going to be equal to the URl total, it becomes 0 to play the first song again
function playNextSong() {
  //Vimeo's player keeps playing, so if it is active, pause it and destroy it!
  if (VMfound && activeIframe == 'vimeo') {
    vimeoPlayer.pause();
    vimeoPlayer.destroy();
  }

	//To avoid confusion, the buttons to Play/Pause, Previous, and Next are disabled
	togglePlayBack(true);

	if (counter == links.length - 1 && reshuffle) shuffleOrder();

	counter = ((counter + 1) == links.length) ? 0 : counter + 1;

	showNextIframe();
	playCurrentSong();
}

//playPreviousSong decrements the counter. If 0, it becomes the links total - 1
function playPreviousSong() {
  //Vimeo's player keeps playing, so if it is active, pause it and destroy it!
  if (VMfound && activeIframe == 'vimeo') {
    vimeoPlayer.pause();
    vimeoPlayer.destroy();
  }

	//To avoid confusion, the buttons to Play/Pause, Previous, and Next are disabled
	togglePlayBack(true);

	counter = (counter == 0) ? links.length - 1 : counter  - 1;

	showNextIframe();
	playCurrentSong();
}

//Hide the previously active iframe to show the one about to play only if the next link requires the hidden player
function showNextIframe() {
	if (activeIframe != '') {
		if (links[order[counter]].includes(soundcloudPrefix)) {
			if (activeIframe == 'youtube' || activeIframe == 'vimeo' || activeIframe == 'dailymotion') $('#' + activeIframe + 'player').hide();
		}
		else if (links[order[counter]].includes(youtubePrefix)) {
			if (activeIframe == 'soundcloud' || activeIframe == 'vimeo' || activeIframe == 'dailymotion') $('#' + activeIframe + 'player').hide();
		}
    else if (links[order[counter]].includes(vimeoPrefix)) {
			if (activeIframe == 'youtube' || activeIframe == 'soundcloud' || activeIframe == 'dailymotion') $('#' + activeIframe + 'player').hide();
		}
    else if (links[order[counter]].includes(dailymotionPrefix)) {
			if (activeIframe == 'youtube' || activeIframe == 'soundcloud' || activeIframe == 'vimeo') $('#' + activeIframe + 'player').hide();
		}
	}
}

//In playCurrentSong, if the next link is from soundcloud, load the iframe with the link and autoplay. If not, the youtubePlayer is loaded and played
function playCurrentSong() {
  if (links[order[counter]].includes(soundcloudPrefix)) {
    activeIframe = 'soundcloud';

		//Load the first soundcloud track, even if twice, to ensure error catching works
		soundcloudPlayer.load(links[order[counter]], {
      auto_play: true,
      visual: true
    });

    soundcloudPlayer.setVolume(50);

    $('#soundcloudplayer').show();
	}
	else if (links[order[counter]].includes(youtubePrefix)) {
    activeIframe = 'youtube';

		var currId = links[order[counter]].replace(youtubePrefix, '');
		youtubePlayer.loadVideoById(currId);

    $('#youtubeplayer').show();
	}
  else if (links[order[counter]].includes(vimeoPrefix)) {
    activeIframe = 'vimeo';

		var currId = links[order[counter]].replace(vimeoPrefix, '');
    $('#vimeoplayer').html('');
    $.ajax({
      type:'GET',
      url: 'https://vimeo.com/api/oembed.json?url=' + encodeURIComponent(links[order[counter]]),
      dataType: 'json',
      complete: function(xhr) {
        if (xhr.status == 200) {
          vimeoPlayer = new Vimeo.Player('vimeoplayer', {
            id: currId,
            width: parseInt($('#holder').width()),
            height: parseInt($('#holder').height()),
            transparent: false,
            autoplay: true
          });

          bindVimeoEvents();

          //Vimeo sometimes won't invoke the play event upon load (or even the load event), so the onPlay() is called to ensure the buttons appear
          onPlay();

          /*vimeoPlayer.ready().then(function() {
              vimeoPlayer.play();
          });*/


          //gets the artwork url of the video
          $.getJSON('https://www.vimeo.com/api/v2/video/' + currId + '.json?callback=?', {format: "json"}, function(data) {
            videoArtwork =  data[0].thumbnail_large;
          });

          //gets the title of the video
          vimeoPlayer.getVideoTitle().then(function(title) {
            videoTitle = title;
          }).catch(function(error) {
              // an error occurred
          });

          //gets the duration of the video
          vimeoPlayer.getDuration().then(function(duration) {
            videoDuration = duration;
          }).catch(function(error) {
              // an error occurred
          });
        }
        else if (xhr.status == 404) {
          $('#vimeoplayer').html('<img src=\'https://f.vimeocdn.com/logo.svg\'><br><br><div class=\'regulartext white\'>There was an error loading your video. Please check your URL...</div>');
          playerError();
        }
      }
    });
    $('#vimeoplayer').show();
	}
  else if (links[order[counter]].includes(dailymotionPrefix)) {
    activeIframe = 'dailymotion';

		var currId = links[order[counter]].replace(dailymotionPrefix, '');
    $('#dailymotionplayer').html('');

    $.ajax({
      type:'POST',
      url: 'http://www.dailymotion.com/services/oembed?url=http://www.dailymotion.com/video/' + currId,
      dataType: 'jsonp',
      complete: function(xhr) {
        var data = xhr['responseJSON'];

        if (data === undefined) {
          //The video is "loaded" anyways to show DailyMotion's 404 page
          dailymotionPlayer = DM.player(document.getElementById('dailymotionplayer'), {
            video: currId,
            width: $('dailymotionplayer').width(),
            width: $('dailymotionplayer').height()
          });
          playerError();
        }
        else {
          dailymotionPlayer = DM.player(document.getElementById('dailymotionplayer'), {
            video: currId,
            width: $('dailymotionplayer').width(),
            width: $('dailymotionplayer').height(),
            autoplay: true
          });

          bindDailyMotionEvents();

          //sometimes dailymotionPlayer won't play, even with autoplay set as true. SO it is forced to
          dailymotionPlayer.play();

          //gets the artwork url of the video
          videoArtwork = data['thumbnail_url'];

          //gets the title of the video
          videoTitle = data['title'] + ' by ' + data['author_name'];

          //gets the duration of the video
          $.getJSON('https://api.dailymotion.com/video/' + currId + '?fields=duration', function(data) {
            videoDuration = data['duration'];
          });
        }
      }
    });
    $('#dailymotionplayer').show();
	}
}

//Handles the going to the previous song
export function prepPrev() {
	//make sure the players are paused before going to the previous song
	paused = false;
  inTransition = true;
	togglePlay();

	playPreviousSong();
}

//Handles the going to the next song
export function prepNext() {
	//make sure the players are paused before going to the previous song
	paused = false;
  inTransition = true;
	togglePlay();

	playNextSong();
}

//Shuffles the order array
function shuffleOrder() {
	for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
}

//Controls the status of the players to change to play/pause
export function togglePlay() {
	if (paused) {
		if (activeIframe == 'youtube') youtubePlayer.playVideo();
		else if (activeIframe == 'soundcloud') soundcloudPlayer.play();
    else if (activeIframe == 'vimeo') vimeoPlayer.play();
    else if (activeIframe == 'dailymotion') dailymotionPlayer.play();
	}
	else {
		if (activeIframe == 'youtube') youtubePlayer.pauseVideo();
		else if (activeIframe == 'soundcloud') soundcloudPlayer.pause();
    else if (activeIframe == 'vimeo') vimeoPlayer.pause();
    else if (activeIframe == 'dailymotion') dailymotionPlayer.pause();
	}
}

//Changes the boolean value to properly play/pause, as well as changing the Play/Pause button look
function changePause(pstats) {
	paused = pstats;

  if (inTransition) {
    if (paused) $('#playpausebtn').attr('src', './buttons/disabled/play.png');
    else $('#playpausebtn').attr('src', './buttons/disabled/pause.png');
  }
  else {
    if ($('#playpausebtn').is(':hover')) {
      if (paused) $('#playpausebtn').attr('src', './buttons/active/play.png');
      else $('#playpausebtn').attr('src', './buttons/active/pause.png');
    }
    else {
      if (paused) $('#playpausebtn').attr('src', './buttons/play.png');
      else $('#playpausebtn').attr('src', './buttons/pause.png');
    }
  }
}

//Enables/disables the playback buttons
function togglePlayBack(pstats) {
  if (pstats) {
    $('#prevbtn').attr('src', './buttons/disabled/prev.png');
    $('#prevbtn').attr('onclick', '');
    $('#prevbtn').css('cursor', '');

    if (paused) $('#playpausebtn').attr('src', './buttons/disabled/play.png');
    else $('#playpausebtn').attr('src', './buttons/disabled/pause.png');
    $('#playpausebtn').attr('onclick', '');
    $('#playpausebtn').css('cursor', '');

    $('#nextbtn').attr('src', './buttons/disabled/next.png');
    $('#nextbtn').attr('onclick', '');
    $('#nextbtn').css('cursor', '');
  }
  else {
    if ($('#prevbtn').is(':hover')) $('#prevbtn').attr('src', './buttons/active/prev.png');
    else $('#prevbtn').attr('src', './buttons/prev.png');
    $('#prevbtn').attr('onclick', 'prepPrev()');
    $('#prevbtn').css('cursor', 'pointer');

    if (inTransition) {
      if (paused) $('#playpausebtn').attr('src', './buttons/disabled/play.png');
      else $('#playpausebtn').attr('src', './buttons/disabled/pause.png');
    }
    else {
      if ($('#playpausebtn').is(':hover')) {
        if (paused) $('#playpausebtn').attr('src', './buttons/active/play.png');
        else $('#playpausebtn').attr('src', './buttons/active/pause.png');
      }
      else {
        if (paused) $('#playpausebtn').attr('src', './buttons/play.png');
        else $('#playpausebtn').attr('src', './buttons/pause.png');
      }
    }

    $('#playpausebtn').attr('onclick', 'togglePlay()');
    $('#playpausebtn').css('cursor', 'pointer');

    if ($('#nextbtn').is(':hover')) $('#nextbtn').attr('src', './buttons/active/next.png');
    else $('#nextbtn').attr('src', './buttons/next.png');
    $('#nextbtn').attr('onclick', 'prepNext()');
    $('#nextbtn').css('cursor', 'pointer');
  }

	playbackdisabled = pstats;
}

//changes the copy url GIF image
export function changeCopyImage() {
  var option = $('#upselect').find(":selected").text();
  if (option == 'youtube') $('#upcopy').attr('src', './youtube.gif');
  else if (option == 'soundcloud') $('#upcopy').attr('src', './soundcloud.gif');
  else if (option == 'vimeo') $('#upcopy').attr('src', './vimeo.gif');
  else if (option == 'dailymotion') $('#upcopy').attr('src', './dailymotion.gif');
}

//changes the guidelines for each platform
export function changeGuidelines() {
  var option = $('#upsecguid').find(":selected").text();
  if (option == 'youtube') $('#guidelines').html(youtubeGuidelines);
  else if (option == 'soundcloud') $('#guidelines').html(soundcloudGuidelines);
  else if (option == 'vimeo') $('#guidelines').html(vimeoGuidelines);
  else if (option == 'dailymotion') $('#guidelines').html(dailymotionGuidelines);
}

//forces a play state to keep program flow. Usually needed in mobile devices
function forcePlay() {
  if (activeIframe == 'youtube') youtubePlayer.playVideo();
  else if (activeIframe == 'soundcloud') soundcloudPlayer.play();
  else if (activeIframe == 'vimeo') vimeoPlayer.play();
  else if (activeIframe == 'dailymotion') dailymotionPlayer.play();
}
