$(window).ready(onRender);

function onRender(){
    $('#TagToUse').on('click',function() {
        copyToClipboard( $( this ) )
    });
}

function copyToClipboard(element) {
    console.log('teste');
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val($(element).val()).select();
    document.execCommand("copy");
    $temp.remove();
  }