#!/usr/bin/env bash
# ==============================================================================
# devops-git-commit-push.sh - Flujo Agil y Seguro de Commit y Push en Git
# ==============================================================================
# Proposito: Inspecciona el estado del repositorio, gestiona commits con mensaje
#            asistido o por argumento y sube los cambios a la rama activa en origin.
#            Adaptado para Swirl Baseline respetando estandares DevOps y Zero Emojis.
# ==============================================================================
set -euo pipefail

echo "======================================================================"
echo "[SWIRL DEVOPS] PROCESO DE CONFIRMACION Y SUBIDA A GIT (COMMIT & PUSH)"
echo "======================================================================"
echo ""

# 1. Verificar si estamos dentro de un repositorio Git
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "[ERROR] El directorio actual no es un repositorio Git valido."
    exit 1
fi

CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "main")
echo "[GIT] Rama actual detectada: $CURRENT_BRANCH"
echo ""

# 2. Analizar estado de archivos locales
echo "[GIT] Analizando estado de archivos en el repositorio..."
git status --short
echo ""

HAS_CHANGES=false
if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git status --porcelain)" ]; then
    HAS_CHANGES=true
fi

UNPUSHED_COMMITS=$(git log origin/"$CURRENT_BRANCH"..HEAD --oneline 2>/dev/null || true)

if [ "$HAS_CHANGES" = false ] && [ -z "$UNPUSHED_COMMITS" ]; then
    echo "[OK] No hay cambios pendientes ni commits por subir. Tu copia local esta al dia."
    echo "======================================================================"
    exit 0
fi

# 3. Confirmar cambios si existen
if [ "$HAS_CHANGES" = true ]; then
    echo "[GIT] Se detectaron cambios locales pendientes."
    
    COMMIT_MSG="${1:-}"
    if [ -z "$COMMIT_MSG" ]; then
        echo -n "[PROMPT] Introduce el mensaje del commit: "
        read -r COMMIT_MSG
    fi
    
    if [ -z "$COMMIT_MSG" ]; then
        echo "[ERROR] El mensaje del commit no puede estar vacio."
        exit 1
    fi
    
    echo ""
    echo "[GIT] Agregando todos los cambios a Git (git add -A)..."
    git add -A
    
    echo "[GIT] Registrando commit..."
    git commit -m "$COMMIT_MSG"
fi

CURRENT_HASH=$(git rev-parse --short HEAD)
echo "[GIT] Commit local listo: $CURRENT_HASH"
echo ""

# 4. Subir a origin
echo "[GIT] Subiendo cambios a origin/$CURRENT_BRANCH..."
git push origin "$CURRENT_BRANCH"

echo ""
echo "======================================================================"
echo "[SUCCESS] Cambios sincronizados y subidos exitosamente a origin/$CURRENT_BRANCH"
echo "======================================================================"
