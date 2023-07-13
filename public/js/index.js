var timer, chatsgroupsstate, cropper, usrgrppro;
var groupusers = [];

var vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty("--vh", `${vh}px`);

window.addEventListener('resize', () => {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
});

$(function () {
    getnormalchats()
    updateunreadmsgs()
})

async function getnormalchats() {
    const results = await $.get('/api/chats/normalchat', { userid: userloggedin._id })

    const users = await Promise.all(results.map(async result => {
        const noof = await $.get('/api/messages/noofunreadmsgs', { chatid: result._id });
        var user = result.users.filter(user => {
            return user._id != userloggedin._id
        })
        user[0].latestmsg = result.latestmsg;
        user[0].noofunreadmsgs = noof.length;
        return user[0]
    }))
    if (users.length !== 0) {
        outputUser(users, $('.chatscontainer'));
    } else {
        $('.chatscontainer').empty()
        $('.chatscontainer').append('<p>No chats yet. Search your friends and enjoy chatting with them.</p>')
    }
    tabseffect('chatstab');
}

$('.searchbuttonicon').click(function () {
    $('.optioncontainer').empty();
    $('.optioncontainer').append(`<div class="groupheading">
                                    <i class="fi fi-br-arrow-small-left back"></i>
                                    <span>New chat</span>
                                </div>
                                <div class="searchboxcontainer">
                                    <div class="searchbox">
                                        <i class="fi fi-br-search"></i>
                                        <input id="mainsearchbox" type="text" placeholder="Search or start new chat" autofocus>
                                    </div>
                                </div>
                                <div class="groupchatscontainer"></div>`)
    $('.optioncontainer').animate({ width: $('.chats').width() }, 'slow');
})

$('.groupbuttonicon').click(function () {
    $('.optioncontainer').empty();
    $('.optioncontainer').append(`<div class="groupheading">
                                    <i class="fi fi-br-arrow-small-left back"></i>
                                    <span>Add group participants</span>
                                </div>
                                <div class="selectedusers"></div>
                                <div class="groupinputbox">
                                    <input id="groupsearchbox" type="text" placeholder="Type contact name" autofocus>
                                    <div class="creategroupbtn">Create group</div>
                                </div>
                                <div class="groupchatscontainer"></div>`)
    $('.optioncontainer').animate({ width: $('.chats').width() }, 'slow');
    usrgrppro = 'group';
})

$('.profilePic').click(function () {
    $('.optioncontainer').empty();
    $('.optioncontainer').append(`<div class="groupheading">
                                    <i class="fi fi-br-arrow-small-left back"></i>
                                    <span>Profile</span>
                                </div>
                                <label for="inputpic">
                                    <div class="groupprofile dp">
                                        <img src="${userloggedin.profilepic}" alt="">
                                        <div class="dphoverlogo">
                                            <i class="fi fi-br-camera"></i><div>CHANGE <br> PROFILE PHOTO</div>
                                        </div>
                                    </div>
                                </label>
                                <input type="file" style="visibility: hidden" id="inputpic" name="avatar">
                                <form action='/api/users/updateAbout' method='POST'>
                                    <div class="proffield"><span>Your name</span><input type="text" value="${userloggedin.name}" name="name"></div>
                                    <div class="proffield"><span>About</span><input type="text" value="${userloggedin.about}" name="about"></div>
                                    <input type='submit' class="chngabout" value="Save changes">
                                </form>`)
    $('.optioncontainer').animate({ width: $('.chats').width() }, 'slow');
    usrgrppro = 'user';
})

$(document).on('keydown', '.proffield input', function () {
    $('.chngabout').css({ display: 'block' })
})
$(document).on('click', '.chngabout', function () {
    $('.chngabout').css({ display: 'block' })
})

$('.optioncontainer').on('click', '.back', function () {
    $('.optioncontainer').animate({ width: '0%' }, '1', function () {
        $('.optioncontainer').empty();
        groupusers = [];
        getnormalchats()
    })
})

$('.optioncontainer').on('change', '#inputpic', function (e) {
    const image = $('#profileimg');
    image.attr('src', URL.createObjectURL(e.target.files[0]));
    if (cropper !== undefined) {
        cropper.destroy();
    }
    cropper = new Cropper(image[0], {
        aspectRatio: 1 / 1,
        background: false
    });
    $('.picuploadpop').css({ display: 'flex' })
})

$('.okbtn').click(function () {
    $('.loading').css({ display: 'flex' });
    var canvas = cropper.getCroppedCanvas();

    if (canvas == null) {
        alert("Could not upload image. Make sure it is an image file.");
        return;
    }

    canvas.toBlob((blob) => {
        var formData = new FormData();
        formData.append("croppedImage", blob);

        if (usrgrppro === 'user') {
            $.ajax({
                url: "/api/users/profilePicture",
                type: "POST",
                data: formData,
                processData: false,
                contentType: false,
                success: result => {
                    userloggedin = result;
                    $('.picuploadpop').toggle()
                    $('.profilePic').click()
                    $('.profilePic img').attr('src', userloggedin.profilepic)
                    $('.loading').css({ display: 'none' })
                }
            })
        } else {
            $.ajax({
                url: "/api/chats/profilePicture",
                type: "POST",
                data: formData,
                processData: false,
                contentType: false,
                success: result => {
                    $('.picuploadpop').toggle()
                    $('.setgroupprofile img').attr('src', result);
                }
            })
        }
    })
})
$('.picuploadpop').click(function (e) {
    if (!$('.popupbox').is(e.target) && !$('.popupbox').find('*').not('.cross').is(e.target)) {
        $('.picuploadpop').toggle()
    }
})

$('.chatsbuttonicon').click(function () {
    getnormalchats()
})

$('.optioncontainer').on('keydown', '#mainsearchbox', function () {
    clearTimeout(timer)
    timer = setTimeout(() => {
        searchingusers($('#mainsearchbox'));
    }, 1000)
})

$('.optioncontainer').on('keydown', '#groupsearchbox', function (event) {
    if ($('#groupsearchbox').val() === '' && event.which === 8) {
        groupusers.pop();
        displaygroupusers();
        $('.groupchatscontainer').empty()
    }
    clearTimeout(timer)
    timer = setTimeout(() => {
        searchingusers($('#groupsearchbox'), true);
    }, 1000)
})

function searchingusers(container, group = false) {
    const value = container.val().trim()
    if (value === '') return $('.groupchatscontainer').html('')
    $.get('/api/users', { search: value }, results => {
        if (group) {
            results = results.filter(x => !(groupusers.some(y => _.isEqual(x, y))))
        }
        outputUser(results, $('.groupchatscontainer'), group)
    })
}

function outputUser(results, container, group) {
    container.empty()
    results.forEach(result => {
        if (result._id === userloggedin._id) return
        var html = createuserHtml(result);
        var element = $(html)
        element.click(async () => {
            if (!group) {
                await displaychat(result, false, true)
                if (window.innerWidth < 990) {
                    $('.messages').css({ display: 'flex' })
                    $('.chats').toggle()
                }
                updateunreadmsgs()
            } else {
                groupusers.push(result);
                displaygroupusers();
                searchingusers($('#groupsearchbox'), true);
            }
        })
        container.append(element)
    })
}

function createuserHtml(result) {

    var about = result.about;
    var lastseen = ''
    if (result.latestmsg) {
        about = result.latestmsg.sender === userloggedin._id ? `You: ${result.latestmsg.content}` : result.latestmsg.content;
        lastseen = new Date(result.latestmsg.createdAt).toLocaleString('en-IN');
    }
    var notebadgedisplay = (result.noofunreadmsgs == undefined || result.noofunreadmsgs === 0) ? "none" : "block";

    return `<div class=chat data-userid=${result._id}>
                <div class="pic"><img src=${result.profilepic} alt=""></div>
                <div class="info">
                    <div class="name">
                        <span>${result.name}</span>
                        <span>${lastseen}</span>
                    </div>
                    <div class="lastmessage">
                        <span>${about}</span>
                        <span class="notebadge" style="display: ${notebadgedisplay}">${result.noofunreadmsgs}</span>
                    </div>
                </div>
            </div>`
}

async function displaychat(result, group = false, clicked = false) {
    var html, res;
    if (!group) {
        res = await $.post('/api/chats', { user: JSON.stringify(result), groupchat: false })
        html = createrightHtml(res);
    } else {
        res = result;
        html = createrightHtml(res, true)
    }
    var element = $(html);
    $('.messages').empty()
    $('.messages').append(element);
    $.get('/api/messages', { chatid: res._id }, msgs => {
        msgs.forEach(msg => {
            displaymsg(msg)
        })
        scrolltobottom(false)
    });
    $.ajax({
        url: '/api/messages/markasread',
        type: 'PUT',
        data: { chatid: res._id },
        success: data => {

        }
    })
    if (clicked)
        chatsgroupsstate === 'chats' ? getnormalchats() : getgroupchats();
}

function createrightHtml(result, group = false) {

    var user;
    if (!group) {
        user = result.users.filter(user => {
            return user._id != userloggedin._id
        })
        user = user[0]
    } else {
        user = result;
    }

    return `<div class="profnav">
                <i class="fi fi-br-arrow-small-left phoneback"></i>
                <div class="pic"><img src=${user.profilepic} alt=""></div>
                <div class="details">
                    <div>${user.name}</div>
                    <div>Today</div>
                </div>
                <div class="icons">
                    <i class="fi fi-br-search"></i>
                    <i class="fi fi-br-menu-dots-vertical"></i>
                </div>
            </div>
            <div class="messagescontainer">
                <div class="chatback"><img src="images/chatback.png" alt=""></div>
            </div>
            <div class="sentbox" data-chatid=${result._id} data-isgroup=${group}>
                <div class="chatback"><img src="images/chatback.png" alt=""></div>
                <i class="fi fi-br-grin"></i>
                <i class="fi fi-br-clip"></i>
                <input type="text" placeholder="Type a message" class="msginput">
                <div class="sendbtn microphone"><i class="fi fi-br-circle-microphone"></i></div>
                <div class="sendbtn plane"><i class="fi fi-br-paper-plane msgbutton"></i></div>
            </div>`
}

$(document).on('click', '.phoneback', function () {
    $('.messages').toggle()
    $('.chats').css({ display: 'flex' })
})

function displaygroupusers() {
    $('.selectedusers').empty()
    groupusers.forEach((user, index) => {
        $('.selectedusers').append(`<div class="selecteduser">
                                        <img src=${user.profilepic} alt="">
                                        <span>${user.name}</span>
                                        <i class="fi fi-br-cross-small unselect" data-index=${index}></i>
                                    </div>`)
    })

    $('.creategroupbtn').css({ display: groupusers.length !== 0 ? 'block' : 'none' })
    $('#groupsearchbox').focus();
}

$('.optioncontainer').on('click', '.unselect', function () {
    var index = $(this).data('index')
    groupusers.splice(index, 1);
    displaygroupusers();
    searchingusers($('#groupsearchbox'), true);
})

$('.optioncontainer').on('click', '.creategroupbtn', function () {
    $('.optioncontainer').empty()
    $('.optioncontainer').append(`<div class="groupheading">
                                    <i class="fi fi-br-arrow-small-left back"></i>
                                    <span>Add group participants</span>
                                </div>
                                <label for="inputpic">
                                    <div class="setgroupprofile">
                                        <img src="images/profilePic.jpeg" alt="">
                                        <div class="dphoverlogo2">
                                            <i class="fi fi-br-camera"></i><div>ADD GROUP <br> ICON</div>
                                        </div>
                                    </div>
                                </label>
                                <input type="file" style="visibility: hidden" id="inputpic" name="avatar">
                                <input type="text" class="groupnameinput" placeholder="Group Subject">
                                <div class="tickicon"><i class="fi fi-br-check"></i></div>`)
})

$('.optioncontainer').on('click', '.tickicon', async function () {
    var result = await $.post('/api/chats', { users: JSON.stringify(groupusers), name: $('.groupnameinput').val(), groupchat: true, profilepic: $('.setgroupprofile img').attr('src') })
    getgroupchats()
    await displaychat(result, true)
    if (window.innerWidth < 990) {
        $('.messages').css({ display: 'flex' })
        $('.chats').toggle()
    }
    $('.back').click()
})

$('.grouptab').click(function () {
    getgroupchats()
})

$('.chatstab').click(function () {
    getnormalchats()
})

function getgroupchats() {
    $.get('/api/chats/groupchat', { userid: userloggedin._id }, results => {
        $('.chatscontainer').empty()
        if (results.length !== 0) {
            results.forEach(async result => {
                const noof = await $.get('/api/messages/noofunreadmsgs', { chatid: result._id });
                result.noofunreadmsgs = noof.length;
                var html = creategroupchathtml(result)
                var element = $(html)
                element.click(async () => {
                    await displaychat(result, true, true)
                    if (window.innerWidth < 990) {
                        $('.messages').css({ display: 'flex' })
                        $('.chats').toggle()
                    }
                    updateunreadmsgs()
                })
                $('.chatscontainer').append(element)
            })
        } else {
            $('.chatscontainer').append('<p>No groups yet. You create a group.</p>')
        }
    })
    tabseffect('grouptab')
}

function tabseffect(selectedtab) {
    const unselectedtab = selectedtab === 'chatstab' ? 'grouptab' : 'chatstab'
    $(`.${selectedtab}`).css({ borderBottom: '3px solid white', color: 'white' })
    $(`.${unselectedtab}`).css({ borderBottom: '0', color: 'rgb(185, 181, 181)' })
    $(`.${selectedtab} .notebadge`).css({ backgroundColor: 'white' })
    $(`.${unselectedtab} .notebadge`).css({ backgroundColor: 'rgb(185, 181, 181)' })
    chatsgroupsstate = selectedtab === 'chatstab' ? 'chats' : 'groups';
}

function creategroupchathtml(result) {
    var lastseen = ''
    var about = ''
    if (result.latestmsg) {
        about = `${result.latestmsg.sender._id == userloggedin._id ? `You` : result.latestmsg.sender.name}:${result.latestmsg.content}`;
        lastseen = new Date(result.latestmsg.createdAt).toLocaleString('en-IN');
    }
    var notebadgedisplay = result.noofunreadmsgs === 0 ? "none" : "block";

    return `<div class=chat data-chatid1=${result._id}>
                <div class="pic"><img src=${result.profilepic} alt=""></div>
                <div class="info">
                    <div class="name">
                        <span>${result.name}</span>
                        <span>${lastseen}</span>
                    </div>
                    <div class="lastmessage">
                        <span>${about}</span>
                        <span class="notebadge" style="display: ${notebadgedisplay}">${result.noofunreadmsgs}</span>
                    </div>
                </div>
            </div>`
}

$('.messages').on('click', '.msgbutton', function () {
    submitmsg()
})

$('.messages').on('keydown', '.msginput', (event) => {
    if (event.which === 13) {
        submitmsg()
    }
})

function submitmsg() {
    var msg = $('.msginput').val().trim();
    $('.msginput').val('')
    var chatid = $('.sentbox').data('chatid');
    if (msg !== '') {
        $.post('/api/messages', { content: msg, chatid: chatid }, result => {
            displaymsg(result)
            scrolltobottom(true)
            socket.emit('msg', result)
            updatelastmessage(result)
        })
    }
    // $('.sentbox').data('isgroup') === true ? getgroupchats() : getnormalchats();
}

function messagerecieved(msg) {
    if ($(`[data-chatid="${msg.chat._id}"]`).length == 0) {
        displaynotification(msg);
        updatelastmessage(msg);
        updateunreadmsgs();
    } else {
        displaymsg(msg);
        scrolltobottom(true)
        $.ajax({
            url: '/api/messages/markasread',
            type: 'PUT',
            data: { chatid: msg.chat._id },
            success: data => {

            }
        })
        $('.sentbox').data('isgroup') === true ? getgroupchats() : getnormalchats();
    }
}

function updatelastmessage(msg) {
    if (msg.chat.isgroupchat) {
        $(`[data-chatid1=${msg.chat._id}] .lastmessage`).text(msg.content)
    } else {
        $(`[data-userid=${msg.sender._id}] .lastmessage`).text(msg.content)
    }
    chatsgroupsstate === 'chats' ? getnormalchats() : getgroupchats();
}

function displaynotification(msg) {

    var pic, name, message;
    if (msg.chat.isgroupchat) {
        pic = msg.chat.profilepic;
        name = msg.chat.name;
        message = `${msg.sender.name}:${msg.content}`;
    } else {
        pic = msg.sender.profilepic;
        name = msg.sender.name;
        message = msg.content
    }

    $('.container').append(`<div class="notificationbox">
                                <div class="notepic"><img src=${pic} alt=""></div>
                                <div class="notecontent">
                                    <div class="notename">${name}</div>
                                    <div class="notemsg">${message}</div>
                                </div>
                            </div>`)
    $('.notificationbox').animate({ opacity: 1 }, 1200, function () {
        $(this).delay(2000).animate({ opacity: 0 }, 300);
    })
}

function displaymsg(result) {
    var html = createmsgHtml(result);
    var element = $(html)
    $('.messagescontainer').append(element);
}

function createmsgHtml(result) {
    var ismine = '';
    if (result.sender._id === userloggedin._id) {
        ismine = 'mine'
    }

    return `<div class="msg ${ismine}">
                <span>${result.content}</span>
            </div>`
}

function scrolltobottom(animation) {
    const container = $('.messagescontainer');
    const scrollheight = container.prop("scrollHeight");

    if (animation) {
        container.animate({ scrollTop: scrollheight }, 'slow');
    } else {
        container.scrollTop(scrollheight);
    }
}

async function updateunreadmsgs() {
    const suc = await $.get('/api/messages/usersunreadmsgs')
    $('.chatstab .notebadge').text(suc.filter(r => r.chat.isgroupchat === false).length)
    $('.grouptab .notebadge').text(suc.filter(r => r.chat.isgroupchat === true).length)
    if ($('.grouptab .notebadge').text() === '0')
        $('.grouptab .notebadge').css({ display: 'none' })
    if ($('.chatstab .notebadge').text() === '0')
        $('.chatstab .notebadge').css({ display: 'none' })
}
