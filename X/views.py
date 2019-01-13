from django.shortcuts import render
from django.http import *
import json
import codecs


# Create your views here.
def show_editor_page(request):
    return render(request, "editor.html")


def show_preview_page(request):
    return render(request, "preview.html")


def edit_models(request):
    filename = 'save.json'

    if request.method == 'GET':
        try:
            with codecs.open(filename, encoding='utf8') as file:
                return HttpResponse(file.read())
        except:
            return JsonResponse({})
    else:
        with codecs.open(filename, mode="w", encoding='utf8') as file:
            obj = json.loads(request.body)
            file.write(json.dumps(obj, ensure_ascii=False, indent=2))

        return JsonResponse({"status": "ok"})

