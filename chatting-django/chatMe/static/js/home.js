$(document).ready(function(){
	$('#action_menu_btn').click(function(){
		$('.action_menu').toggle();
	});
});

function set_contact(contact_li){
	var id = $(contact_li).attr('id');
	$(contact_li).find('.contact-status').removeClass('busy');
	$.ajax({
		type : "GET",
		url : "/api/call-set/?id=" + id,
		beforeSend: function(request) {
			request.setRequestHeader("Authorization", "Token " + TOKEN);
		},
		success: function(answer){
			show_calls(answer, id, $(contact_li));
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			alert("some error " + String(errorThrown) + String(textStatus) + String(XMLHttpRequest.responseText));
		}
	});
}

function show_calls(call_set, user_name, contact_element){
	var list_elements = $('#contacts li');
	list_elements.each(function(idx, li){
		$(li).removeClass('active');
	});
	contact_element.addClass('active');
	var profile_image_src = contact_element.find("img").attr("src");
	var contact_id = contact_element.attr('id');
	var profile_name = contact_element.find("#profile_name").text();

	var html = `<div class="card-header msg_head">
	<div class="d-flex bd-highlight">
	<div class="img_cont">
	<img src="`+ profile_image_src +`" class="rounded-circle user_img">
	</div>
	<div class="user_info">
	<span>` + profile_name + `</span>
	<p>` + call_set.length +  ` Calls</p>
	</div>
	</div>
	<span id="action_menu_btn"><i class="fas fa-ellipsis-v"></i></span>
	<div class="action_menu">
	<ul>
	<li><i class="fas fa-user-circle"></i> View profile</li>
	<li><i class="fas fa-users"></i> Add to close friends</li>
	<li><i class="fas fa-plus"></i> Add to group</li>
	<li><i class="fas fa-ban"></i> Block</li>
	</ul>
	</div>
	</div>
	<div class="card-body msg_card_body" id="messages_list">

	</div>
	<div class="card-footer row">
	<div class="col-6 video_cam">
	<span><a href="#video_pop"><i class="fas fa-video empty_fill"></i></a></span>
	</div>
	<div class="col-6 video_cam">
	<span><a href="#audio_pop"><i class="fas fa-phone empty_fill"></i></a></span>
	</div>
	</div>`;

	$('#caller_pane').html(html);
	for (var i = 0; i < call_set.length; i++) {
		if (call_set[i]['sender'] != CURRENT_USER) {
			insert_received_call(call_set[i]);
		} else {
			insert_sent_call(call_set[i]);
		}
	}

	$(".msg_card_body").animate({ scrollTop: $(".msg_card_body").prop('scrollHeight') }, "fast");
}

function insert_sent_call(call){
	var date= new Date(call['date']);
	var content = call['missed_call'] ? 'Cevapsız arama' : 'Giden arama';
	var html = `<div class="d-flex justify-content-start mb-4">
	<div class="img_cont_msg">
	<img src="` + call['sender_url'] + `" class="rounded-circle user_img_msg">
	</div>
	<div class="msg_cotainer">
	` + content  + ' : ' + date.toLocaleTimeString("tr-TR") +`
	<span class="msg_time">` + date.toLocaleDateString("tr-TR") + `</span>
	</div>
	</div>`;

	$('#messages_list').append(html);
}

function insert_received_call(call){
	var date= new Date(call['date']);
	var content = call['missed_call'] ? 'Cevapsız arama' : 'Gelen arama';
	var html = `<div class="d-flex justify-content-end mb-4">
	<div class="msg_cotainer_send">
	`  + content  + ' : ' + date.toLocaleTimeString("tr-TR") +`
	<span class="msg_time_send">` + date.toLocaleDateString("tr-TR") + `</span>
	</div>
	<div class="img_cont_msg">
	<img src="` + call['sender_url'] + `" class="rounded-circle user_img_msg">
	</div>
	</div>`;

	$('#messages_list').append(html);
}

$(function() {
	if ($('.contacts').find('li')[0] !== undefined) {
		set_contact($('#contacts').find('li')[0]);
	}
});

socket.on('refresh-connected-users', (users) => {
	var list_elements = $('.contacts li');
	list_elements.each(function(idx, li){
		if (users.includes($(li).attr('id'))) {
			$(li).find('.online_icon').removeClass('offline');
		} else {
			$(li).find('.online_icon').addClass('offline');
		}
	});
});

$(".msg_card_body").animate({ scrollTop: $(".msg_card_body").prop('scrollHeight') }, "fast");

socket.on('add-call', function(content) {
	if (content['type'] == 'S' ) {
		var contact = $('#contacts').find('.active')[0];
		if (contact !== undefined) {
			var contact_element = $(contact);
			if (contact_element.attr('id') == content['sender']) {
				insert_received_call(content);
			} else if (contact_element.attr('id') == content['receivers'][0]) {
				insert_sent_call(content);
			}
		}
		var list_elements = $('#contacts li');
		list_elements.each(function(idx, li){
			if ($(li).attr('id') == content['sender'] || $(li).attr('id') == content['receivers'][0] )
			{
				if (idx != 0) {
					var $this = $(li);
					var callback = function() {
						$this.insertBefore($this.siblings(':eq(0)'));
					};
					$this.slideUp(300, callback).slideDown(300);
				}
			}
		});
	}
	$(".msg_card_body").animate({ scrollTop: $(".msg_card_body").prop('scrollHeight') }, "fast");
});

function startAudioCall() {
	var contact = $('#contacts').find('.active')[0];
	if (contact !== undefined) {
		var contact_id = $(contact).attr("id");
		if (contact_id !== undefined) {
			var newCall = {
				sender: CURRENT_USER,
				receiver: contact_id,
				is_video: false
			}
			socket.emit('new-call', newCall);
		}
	}
}

function startVideoCall() {
	var contact = $('#contacts').find('.active')[0];
	if (contact !== undefined) {
		var contact_id = $(contact).attr("id");
		if (contact_id !== undefined) {
			var newCall = {
				sender: CURRENT_USER,
				receiver: contact_id,
				is_video: true
			};
			socket.emit('new-call', newCall);
		}
	}
}


var destination_id = null;
var video_stream = false;

socket.on('show-coming-call', (call) => {
	$('#coming_call').find('img').attr("src", call['sender_url']);
	if (call.is_video) {
		$('#coming_call').find('p').text(call.sender_name + ' sizi görüntülü olarak arıyor, açmak ister misiniz ?');
	} else {
		$('#coming_call').find('p').text(call.sender_name + ' sizi sesli olarak arıyor, açmak ister misiniz ?');
	}

	location.href = '#coming_call';
	$('#reject_button').on('click', () => {
		socket.emit('reject-call', call);
		location.href = '#';
	});

	$('#accept_button').on('click', () => {
		socket.emit('accept-call', call);
		if (call.is_video) {
			location.href = '#video_call';
			destination_id = call.sender;
			video_stream = true;
			listen = true;
			initVideo();
			setTimeout(function(){ toggleRecording(); }, 1000);
		} else {
			$('#audio_call').find('img').attr("src", call['receiver_url']);
			$('#audio_call').find('button').on("click", () => {
				toggleRecording();
				listen = false;
				location.href = '#';
			});
			location.href = '#audio_call';
			destination_id = call.sender;
			listen = true;
			initAudio();
			setTimeout(function(){ toggleRecording(); }, 1000);
		}
	});
});

var img = document.getElementById("out");
socket.on('show-image', function(data){
	img.src = data;
});

socket.on('init-call', (call) => {
	if (call.is_video) {
		location.href = '#video_call';
		destination_id = call.receivers[0];
		listen = true;
		initVideo();
		setTimeout(function(){ toggleRecording(); }, 1000);
	} else {
		$('#audio_call').find('img').attr("src", call['sender_url']);
		$('#audio_call').find('button').on("click", () => {
			toggleRecording();
			listen = false;
			location.href = '#';
		});
		location.href = '#audio_call';
		destination_id = call.receivers[0];
		listen = true;
		initAudio();
		setTimeout(function(){ toggleRecording(); }, 1000);
	}
});

socket.on('call-rejected', (call) => {
	location.href = '#call_rejected';
});
