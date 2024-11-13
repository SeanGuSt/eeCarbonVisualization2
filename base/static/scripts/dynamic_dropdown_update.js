// This script is courtesy of https://simpleisbetterthancomplex.com/tutorial/2018/01/29/how-to-implement-dependent-or-chained-dropdown-list-with-django.html
function dynamic_dropdown_update(id_provokeChange, id_formChange, request_url, id_toChange){
    $(id_provokeChange).change(function () {
        $.ajax({                       // initialize an AJAX request
        url: $(id_formChange).attr(request_url),  // set the url of the request (= localhost:8000/base/load-params/)
        data: {
            "requested_update" : $(this).val()       // add the country id to the GET parameters
        },
        success: function (data) {   // `data` is the return of the `load_parameters` view function
            $(id_toChange).html(data);  // replace the contents of the city input with the data that came from the server
        }
        });

    });
}
dynamic_dropdown_update("#Locations", "#paramForm", "data-params-url", "#Relationship");