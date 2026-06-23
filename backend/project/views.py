
from rest_framework.decorators import api_view
from rest_framework.generics import RetrieveUpdateDestroyAPIView
from rest_framework.response import Response
from rest_framework import status

from .models import Project
from .serializers import ProjectListSerializer,ProjectSerializer
# Create your views here.

@api_view(['GET','POST'])
def project_list_create(request):
    if request.method=='GET':
        projects=Project.objects.all()
        serializer=ProjectListSerializer(
            projects,
            many=True
        )

        return Response(serializer.data)
    
    serializer=ProjectListSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )
    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST,
    )

class ProjectDetailView(
    RetrieveUpdateDestroyAPIView
):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer