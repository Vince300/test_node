jQuery(function($) {
    $('label').each(function () {
        var id = $(this).attr('for');
        var $input = $('#' + id);
        if ($input.is('select') || $input.is('input') && $input.attr('type') == 'text') {
            $(this).hide();
            $input.attr('placeholder', $(this).text());
        }
    });
})(jQuery);