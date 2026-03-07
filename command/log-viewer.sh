#!/bin/bash
# 大福玩具房 - 日志查看工具
# 用法: ./log-viewer.sh [选项]

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 显示帮助
show_help() {
    echo -e "${GREEN}🎉 大福玩具房 - 日志查看工具${NC}"
    echo ""
    echo "用法: ./log-viewer.sh [选项]"
    echo ""
    echo "选项:"
    echo "  -r, --realtime     实时查看日志（默认）"
    echo "  -e, --error        只查看错误日志"
    echo "  -l, --lines N      显示最后N行（默认50行）"
    echo "  -c, --clear        清空日志文件"
    echo "  -s, --status       查看应用状态"
    echo "  -h, --help         显示帮助"
    echo ""
    echo "示例:"
    echo "  ./log-viewer.sh              # 实时查看日志"
    echo "  ./log-viewer.sh -e           # 只查看错误"
    echo "  ./log-viewer.sh -l 100       # 查看最后100行"
}

# 默认参数
LINES=50
MODE="realtime"

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -r|--realtime)
            MODE="realtime"
            shift
            ;;
        -e|--error)
            MODE="error"
            shift
            ;;
        -l|--lines)
            LINES="$2"
            shift 2
            ;;
        -c|--clear)
            MODE="clear"
            shift
            ;;
        -s|--status)
            MODE="status"
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}未知选项: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# 检查PM2是否安装
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}错误: PM2 未安装${NC}"
    exit 1
fi

# 执行对应操作
case $MODE in
    realtime)
        echo -e "${GREEN}🎉 正在实时查看日志...${NC}"
        echo -e "${YELLOW}按 Ctrl+C 退出${NC}"
        echo ""
        pm2 logs dafu-toy-room --lines $LINES
        ;;
    error)
        echo -e "${RED}❌ 查看错误日志...${NC}"
        echo ""
        tail -n $LINES /root/.pm2/logs/dafu-toy-room-error.log
        ;;
    clear)
        echo -e "${YELLOW}🧹 正在清空日志文件...${NC}"
        pm2 flush dafu-toy-room
        echo -e "${GREEN}✅ 日志已清空${NC}"
        ;;
    status)
        echo -e "${BLUE}📊 查看应用状态...${NC}"
        echo ""
        pm2 status
        echo ""
        echo -e "${BLUE}📈 内存使用情况:${NC}"
        pm2 monit
        ;;
esac
