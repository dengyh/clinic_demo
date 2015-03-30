$(function() {
  var isLogin = false;
  var anTime = 300;
  var elementsSet = {};
  $('#doctor-login-modal').modal('show');

  $('#doctor-login-modal').on('hide.bs.modal', function(event) {
    if (!isLogin) {
      return false;
    }
  });

  $('#login-button').click(function() {
    var doctorID = $('#login-form').find('[name="doctorID"]').val();
    var password = $('#login-form').find('[name="password"]').val();
    if (doctorID == "" || password == "") {
      showMessage('#login-form-message', '登录信息不能为空');
      return false;
    }
    var postData = {
      doctorID: doctorID,
      password: CryptoJS.SHA1(password).toString(),
    }
    $.ajax({
      type: 'POST',
      url: 'http://192.168.0.199:8081/api/doctor/login',
      data: JSON.stringify(postData),
      contentType: 'application/json',
      success: function(data) {
        if (data['result']) {
          isLogin = true;
          $('#doctor-login-modal').modal('hide');
        } else {
          showMessage('#login-form-message', data['message']);
        }
      },
      dataType: 'json',
    });
  });

  $('.disable-click').click(function() {
    return false;
  });


  var diagnoseNow = false;
  $('#patients-button').click(function() {
    if (diagnoseNow) {
      $('#doctor-diagnose').slideUp(anTime, function() {
        $('#doctor-patients').slideDown(anTime);
      });
      diagnoseNow = false;
    } else {
      $('#doctor-pills').slideUp(anTime, function() {
        $('#doctor-patients').slideDown(anTime);
      });
    }
  });

  $('#pills-button').click(function() {
    if (diagnoseNow) {
      $('#doctor-diagnose').slideUp(anTime, function() {
        $('#doctor-pills').slideDown(anTime);
      });
      diagnoseNow = false;
    } else {
      $('#doctor-patients').slideUp(anTime, function() {
        $('#doctor-pills').slideDown(anTime);
      });
    }
  });

  $('#index-button').click(function() {
    diagnoseNow = false;
    $('#doctor-patients').slideUp(anTime);
    $('#doctor-pills').slideUp(anTime);
    $('#doctor-diagnose').slideUp(anTime);
  });

  $('.diagnose-button').click(function() {
    diagnoseNow = true;
    elementsSet = {};
    var name = $(this).parent().siblings().first().html();
    $('#doctor-patients').slideUp(anTime, function() {
      $('#doctor-diagnose').slideDown(anTime);
      $('#diagnoseName').html(name);
      initializeForm();
    });
  });

  $('.element-submit').click(function() {
    var formDom = $(this).parents('.modal-content').find('form');
    var key = formDom.attr('data-key');
    var value = formDom.find('[name="value"]').val();
    var name = findElement(key).name;
    if (value == '') {
      showMessage('.error-message', '数据元内容还未填写');
    } else {
      elementsSet[key] = value;
      $('#elements-tags').tagsinput('add', name);
      $(this).parents('.modal').modal('hide');
    }
  });

  $('.element-cancel').click(function() {
    var formDom = $(this).parents('.modal-content').find('form');
    var key = formDom.attr('data-key');
    var name = findElement(key).name;
    elementsSet[key] = '';
    $('#elements-tags').tagsinput('remove', name);
    $(this).parents('.modal').modal('hide');
  });

  $('.modal').on('hidden.bs.modal', function(e) {
    $(this).find('.error-message').html('');
  });

  function setElementsEvent(dom) {
    dom.find('.element-button').click(function() {
      var key = $(this).attr('data-key');
      var name = $(this).html();
      var element = findElement(key);
      if (!('form' in element)) {
        if (element.type === '_string') {
          showElementModal('string', name, key);
        } else if (element.type === '_date') {
          showElementModal('date', name, key);
        } else {
          showElementModal('search', name, key);
        }
      } else {
        if (element.form === 0) {
          showElementModal('list', name, key);
        } else if (element.form === 1) {
          showElementModal('range', name, key);
        }
      }
    });
  }

  function showElementModal(type, name, key) {
    var selector = '#element-' + type + '-';
    var value;
    if (key in elementsSet) {
      value = elementsSet[key];
    } else {
      value = '';
    }
    $(selector + 'label').html(name);
    $(selector + 'modal').modal('show');
    $(selector + 'modal').find('form').attr('data-key', key);
    $(selector + 'modal').find('form').find('[name="value"]').val(value);
  } 

  function showMessage(messageID, message) {
    $(messageID).fadeOut(500, function() {
      $(messageID).html(message).fadeIn(1000);
    });
  }

  function initializeForm() {
    $('.multi-form').find('form').empty();
    $('#elements-tags').tagsinput('removeAll');
    var dom = $('.multi-form').first();
    var tree = groups;
    for (var key in tree) {
      if (typeof tree[key] != 'string' && 'name' in tree[key]) {
        addGroup(dom.find('form'), key, tree[key]['name'], 'init');
      }
    }
    setRadioAndAddEvent(dom);
  }

  function addGroup(dom, key, name, type) {
    var son = '<label class="radio" for="' + key + '">' + name;
    son += '<input type="radio" name="' + type + '" value="' + key + '" id="' + key + '">';
    son += '</label>';
    dom.append(son);
  }

  function addElement(dom, key) {
    var element = findElement(key);
    var son = '<button class="btn btn-sm btn-primary element-button"'
    son += ' type="button" data-key="' + key + '">';
    son += element['name'] + '</button>';
    dom.append(son);
  }

  function findElement(key) {
    var tree = elements;
    var keyList = key.split('.');
    for (var index in keyList) {
      tree = tree[keyList[index]];
    }
    return tree;
  }

  function setRadioAndAddEvent(rootDom) {
    rootDom.find(':radio').radiocheck();
    rootDom.find(':radio').on('change.radiocheck', function() {
      var nextDom = $(this).parent().parent().parent().nextUntil().first();
      var lastKey = $(this).attr('value');
      var tree = groups;
      var lastKeyList = lastKey.split('.');
      nextDom.find('form').empty();
      nextDom.next().find('form').empty();
      for (var index in lastKeyList) {
        tree = tree[lastKeyList[index]];
      }
      for (var index in tree['elements']) {
        addElement(nextDom.find('form'), tree['elements'][index]);
      }
      setElementsEvent(nextDom);
      for (var key in tree) {
        if (typeof tree[key] != 'string' && 'name' in tree[key]) {
          addGroup(nextDom.find('form'), lastKey + '.' + key, tree[key]['name'], lastKey);
        }
      }
      setRadioAndAddEvent(nextDom);
    });
  }

  var groups = {};
  var elements = {};
  $.ajax({
    url: 'http://192.168.0.199:8081/api/ktree/EMRK/t/tGroup',
    type: 'GET',
    async: false,
    dataType: 'json',
    success: function(data) {
      groups = data;
    },
  });
  $.ajax({
    url: 'http://192.168.0.199:8081/api/ktree/EMRK/t/tElement',
    type: 'GET',
    async: false,
    dataType: 'json',
    success: function(data) {
      elements = data;
    },
  });
  $('#elements-tags').tagsinput();

  // var image = {'image': ['/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAAOABgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD7Y+LvjHxbf6LpWq2mvy+HvD+oax/ZlwbYH7TBGGZXkmYcq3yufLXGAMMSTgeIfE7TfD3hnxgYfBXjCfWrfyI5je/aBI6SkncvmJgN0ByOm7HUGvrjxh4Bg1qK+ksobSVNRUDUdPu9wtr0qBtfcvzRSjAxKoJwACDhSPnAeEPg+PEv9ilPFZuvO8v7L5tv5G/P3fOxv2e+zOK66U0kfk3FWU4yvWabUnKz5m5XVrp8qWijLdq107pXVmd98DvG3jiLwZN4j13VJtW0u31FNPFvcndcMG2AGBzy7BnA8ts5HCkEYJXqXhHwHDo8VjLfQ2kUemqRp2nWm421luzucM2GllOTmRgDycAZYsVhOUXLY+2ybA43DYKnTlW2S396/ndvRdl2SejbS//Z']};

  // $.ajax({
  //     type: 'POST',
  //     url: 'http://192.168.0.199:5555/picture/upload/',
  //     data: JSON.stringify(image),
  //     contentType: 'application/json',
  //     success: function(data) {
  //       console.log(data['paths']);
  //     },
  //     dataType: 'json',
  //   });
});
