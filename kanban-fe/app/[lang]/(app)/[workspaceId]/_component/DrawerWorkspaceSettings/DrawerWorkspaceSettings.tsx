import { useI18n } from '@/contexts/i18n/i18nProvider';
import { WorkSpaceType } from '@/types/WorkSpaceType';
import { AlignLeftOutlined, CarryOutOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Drawer, Tabs } from 'antd';
import { usePathname } from 'next/navigation';
import WorkspaceInfo from './Info/WorkspaceInfo';
import WorkspaceLabel from './Label/WorkspaceLabel';
import WorkspaceLogs from './Log/WorkspaceLogs';

interface Props {
    open: boolean;
    onClose: () => void;
    workspace: WorkSpaceType;
}
function DrawerWorkspaceSettings({
    onClose, open, workspace
}: Props) {
    const pathName = usePathname();
    const i18n = useI18n(pathName.split("/")[1]);

    return (
        <Drawer
            width={500}
            open={open}
            onClose={onClose}
            styles={{
                header: {
                    display: 'none'
                },
                body: {
                    paddingRight: 16,
                    paddingLeft: 16,
                    paddingTop: 8,
                }
            }}
            title={i18n.Common['Menu']}
        >
            <Tabs
                items={[
                    {
                        label: i18n.Common['Activity'],
                        icon: <AlignLeftOutlined />,
                        key: 'activity',
                        children: <WorkspaceLogs workspace={workspace} />
                    },
                    {
                        key: 'label',
                        label: i18n.Common['Label'],
                        icon: <CarryOutOutlined />,
                        children: <WorkspaceLabel workspace={workspace} />
                    },
                    {
                        label: i18n.Common['Info'],
                        icon: <InfoCircleOutlined />,
                        key: 'info',
                        children: <WorkspaceInfo workspace={workspace} />
                    }
                ]}
            />
        </Drawer>
    )
}

export default DrawerWorkspaceSettings